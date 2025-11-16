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
    this.imageGallery = page.locator('[class*="image"], img[alt*="vehicle"]');
    this.deleteImageButton = page.locator('button[class*="delete"]').first();
    this.primaryImageBadge = page.locator('text=Primary').first();
  }

  async goto(vehicleId: string | number) {
    await this.page.goto(`/vehicles/${vehicleId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async clickEdit() {
    await this.editButton.click();
    await this.page.waitForURL('**/edit');
  }

  async clickDelete() {
    await this.deleteButton.click();
  }

  async confirmDelete() {
    await this.page.locator('button:has-text("Delete"), button:has-text("Confirm")').click();
    await this.page.waitForLoadState('networkidle');
  }

  async cancelDelete() {
    await this.page.locator('button:has-text("Cancel")').click();
  }

  async uploadImage(filePath: string, description?: string, isPrimary?: boolean) {
    // Click upload button
    await this.uploadImageButton.click();
    
    // Set the file
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for dialog or form to be ready (some implementations auto-upload on file select)
    const dialogExists = await this.page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (dialogExists) {
      // Fill description if provided and field exists
      if (description) {
        const descriptionInput = this.page.locator('textarea[name="description"], input[name="description"]');
        if (await descriptionInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await descriptionInput.fill(description);
        }
      }
      
      // Set primary checkbox if provided and field exists
      if (isPrimary !== undefined) {
        const checkbox = this.page.locator('input[type="checkbox"][name*="primary"]');
        if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
          const isChecked = await checkbox.isChecked();
          if (isChecked !== isPrimary) {
            await checkbox.click();
          }
        }
      }
      
      // Click upload button in dialog if exists
      const uploadButton = this.page.locator('[role="dialog"] button:has-text("Upload"), [role="dialog"] button[type="submit"]');
      if (await uploadButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await uploadButton.click();
      }
    }
    
    // Wait for upload to complete
    await TestHelpers.delay(2000);
  }

  async deleteImage(index: number = 0) {
    const deleteButtons = await this.page.locator('button:has-text("Delete"), button svg[class*="trash"]').locator('..').all();
    if (deleteButtons.length > index) {
      await deleteButtons[index].click();
    }
  }

  async confirmImageDelete() {
    await this.page.locator('button:has-text("Delete"), button:has-text("Confirm")').click();
    await TestHelpers.delay(1000);
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
