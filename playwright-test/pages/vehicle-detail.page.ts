import { Locator, Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Page Object Model for Vehicle Detail Page
 */
export class VehicleDetailPage {
  readonly page: Page;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly backButton: Locator;
  readonly vehicleName: Locator;
  readonly vehicleStatus: Locator;
  readonly uploadImageButton: Locator;
  readonly imageGallery: Locator;
  readonly deleteImageButton: Locator;
  readonly primaryImageBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editButton = page.locator('a:has-text("Edit"), button:has-text("Edit")').first();
    this.deleteButton = page.locator('button:has-text("Delete")').first();
    this.backButton = page.locator('a:has-text("Back"), button:has-text("Back")').first();
    this.vehicleName = page.locator('h1').first();
    // Status appears next to "Status" label in Basic Information section
    this.vehicleStatus = page.locator('text=Status').locator('..').locator('text=/Available|Rented|Maintenance|Retired/i').first();
    this.uploadImageButton = page.locator('button:has-text("Upload"), label:has-text("Upload")').first();
    // Image gallery items - target the grid container items with images
    this.imageGallery = page.locator('.grid.grid-cols-4 > div.relative.group');
    this.deleteImageButton = page.locator('button[class*="delete"]').first();
    this.primaryImageBadge = page.locator('text=Primary').first();
  }

  async goto(vehicleId: string | number) {
    await this.page.goto(`/vehicles/${vehicleId}`, { timeout: 30000 });
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the main content to be visible instead of networkidle
    await this.vehicleName.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await TestHelpers.delay(1000);
  }

  async clickEdit() {
    await this.editButton.click();
    await this.page.waitForURL('**/edit');
  }

  async clickDelete() {
    await this.deleteButton.click();
  }

  async confirmDelete() {
    // Handle browser's native confirm dialog
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.deleteButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async cancelDelete() {
    // Handle browser's native confirm dialog
    this.page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    await this.deleteButton.click();
  }

  async uploadImage(filePath: string, description?: string, isPrimary?: boolean) {
    // Click upload button to open dialog
    await this.uploadImageButton.click();
    await TestHelpers.delay(500);
    
    // Wait for file input to be ready
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await TestHelpers.delay(1000); // Wait for file to be selected
    
    // Wait for dialog to be visible
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 3000 });
    
    // Fill description if provided
    if (description) {
      const descriptionTextarea = this.page.locator('#description, textarea[placeholder*="caption"], textarea[placeholder*="description"]');
      if (await descriptionTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionTextarea.fill(description);
      }
    }
    
    // Set primary checkbox if provided
    if (isPrimary !== undefined) {
      const checkbox = this.page.locator('#isPrimary');
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isChecked = await checkbox.isChecked();
        if (isChecked !== isPrimary) {
          await checkbox.click();
        }
      }
    }
    
    // Click Upload button in dialog
    const uploadButton = this.page.locator('[role="dialog"] button:has-text("Upload")');
    
    // Check if button is enabled
    const isDisabled = await uploadButton.isDisabled().catch(() => false);
    if (isDisabled) {
      throw new Error('Upload button is disabled - check if file is selected and valid');
    }
    
    // Click and wait briefly
    await uploadButton.click();
    await TestHelpers.delay(500);
    
    // Check for error messages immediately after click
    const errorMessage = this.page.locator('[role="dialog"] [class*="error"], [role="dialog"] [class*="destructive"], [role="dialog"] .text-red-500, [role="dialog"] [role="alert"]');
    const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
    
    if (hasError) {
      const errorText = await errorMessage.textContent();
      throw new Error(`Upload failed with error: ${errorText}`);
    }
    
    // Wait for dialog to close (indicating upload complete)
    // Dialog should close after successful upload
    await this.page.locator('[role="dialog"]').waitFor({ state: 'hidden', timeout: 15000 });
    
    // Wait a bit for UI to update
    await TestHelpers.delay(1000);
  }

  async deleteImage(index: number = 0) {
    // Get all image containers from the gallery grid
    const imageContainers = await this.imageGallery.all();
    
    if (imageContainers.length <= index) {
      throw new Error(`Image at index ${index} not found. Found ${imageContainers.length} images.`);
    }
    
    // Find delete button within the specific image container
    const container = imageContainers[index];
    
    // Hover over container to reveal delete button (it might be hidden initially)
    await container.hover();
    await TestHelpers.delay(500);
    
    // Look specifically for button with trash/delete icon (lucide icon or svg)
    // The button is small and in top-right corner with trash icon
    const deleteButton = container.locator('button').filter({ 
      has: this.page.locator('svg') 
    }).first();
    
    // Ensure button is visible and clickable
    await deleteButton.waitFor({ state: 'visible', timeout: 3000 });
    
    console.log('Found delete button with trash icon, clicking...');
    await deleteButton.click({ force: true });
    await TestHelpers.delay(500);
  }

  async confirmImageDelete() {
    // Wait for confirmation dialog to appear after clicking delete
    await TestHelpers.delay(1500);
    
    // Look for AlertDialog with confirmation button
    // The dialog should have role="alertdialog" or role="dialog"
    const dialog = this.page.locator('[role="alertdialog"], [role="dialog"]').first();
    
    // Wait for dialog to be visible
    const dialogVisible = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!dialogVisible) {
      console.log('No dialog found, looking for confirmation button in page');
    }
    
    // Find the destructive/delete button in the dialog
    // Common patterns: red button, destructive variant, has "Delete" text
    const confirmButton = dialogVisible
      ? dialog.locator('button').filter({ hasText: /delete|confirm|yes/i }).first()
      : this.page.locator('button').filter({ hasText: /delete|confirm|yes/i }).last();
    
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    
    console.log('Found confirmation button, waiting for DELETE API call...');
    
    // Set up listener for DELETE request before clicking
    const deletePromise = this.page.waitForResponse(
      response => {
        const url = response.url();
        const method = response.request().method();
        const isDelete = url.includes('/api/v1/vehicles/') && 
                        url.includes('/images/') && 
                        method === 'DELETE';
        if (isDelete) {
          console.log(`DELETE API call detected: ${url}`);
        }
        return isDelete;
      },
      { timeout: 15000 }
    );
    
    // Click with force to ensure it registers
    await confirmButton.click({ force: true });
    console.log('Confirmation button clicked');
    
    // Wait for deletion API call
    try {
      const response = await deletePromise;
      console.log(`DELETE response status: ${response.status()}`);
      
      if (response.status() >= 200 && response.status() < 300) {
        console.log('Image deletion successful');
      } else {
        console.log(`DELETE failed with status ${response.status()}`);
      }
    } catch (error) {
      console.log('DELETE API call timeout - deletion may not have been triggered');
    }
    
    // Wait for UI to update
    await TestHelpers.delay(2000);
    await this.page.waitForLoadState('networkidle');
  }

  async getImageCount(): Promise<number> {
    const images = await this.imageGallery.all();
    return images.length;
  }

  async verifyVehicleInfo(expectedData: Record<string, any>) {
    for (const [key, value] of Object.entries(expectedData)) {
      if (value !== undefined && value !== null) {
        await expect(this.page.locator(`text=${value}`)).toBeVisible({ timeout: 5000 });
      }
    }
  }

  async verifyPrimaryImage() {
    await expect(this.primaryImageBadge).toBeVisible();
  }

  async clickBack() {
    await this.backButton.click();
    await this.page.waitForURL('**/vehicles');
  }

  async getVehicleId(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/vehicles\/(\d+)/);
    return match ? match[1] : '';
  }
}
