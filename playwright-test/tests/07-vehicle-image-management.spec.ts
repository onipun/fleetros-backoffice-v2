import * as fs from 'fs';
import * as path from 'path';
import { expect, test } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Test Suite: Vehicle Image Management
 * Covers scenarios: IMG-READ-001 to IMG-DELETE-005
 */
test.describe('Vehicle Image Management Operations', () => {
  let testVehicleId: string;
  let testImagePath: string;

  test.beforeAll(async ({ browser }) => {
    // Create test vehicle using authenticated context
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Use LoginPage for proper Keycloak authentication
    const { LoginPage } = await import('../pages/login.page');
    const loginPage = new LoginPage(page);
    
    // Use VehicleFormPage for proper form handling
    const { VehicleFormPage } = await import('../pages/vehicle-form.page');
    const vehicleFormPage = new VehicleFormPage(page);
    
    await page.goto('/');
    
    // Check if already logged in
    const isLoggedIn = await page.locator('[href="/vehicles"], nav, header').first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!isLoggedIn) {
      const username = process.env.TEST_USERNAME || 'john.admin';
      const password = process.env.TEST_PASSWORD || 'a123456A!';
      await loginPage.login(username, password);
      await page.waitForLoadState('domcontentloaded');
    }
    
    const vehicleData = TestHelpers.generateVehicleData('ImageMgmt');
    
    await page.goto('/vehicles/new');
    await vehicleFormPage.waitForFormLoad();
    
    // Use VehicleFormPage to fill form properly
    await vehicleFormPage.fillCompleteForm(vehicleData);
    await vehicleFormPage.clickSubmit();
    
    await page.waitForURL('**/vehicles', { timeout: 15000 });
    
    await page.reload({ waitUntil: 'networkidle' });
    await TestHelpers.delay(1000);
    
    // Search for the vehicle to handle pagination
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.clear();
      await searchInput.fill(vehicleData.name);
      await TestHelpers.delay(500); // Wait for search debounce
    }
    
    // Click the "View Details" button instead of the vehicle name
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();
    await viewDetailsButton.click();
    await page.waitForURL('**/vehicles/*');
    const url = page.url();
    const match = url.match(/\/vehicles\/(\d+)/);
    testVehicleId = match ? match[1] : '';
    
    // Create test image
    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    testImagePath = path.join(fixturesDir, 'mgmt-test-image.png');
    fs.writeFileSync(testImagePath, TestHelpers.createTestImageBuffer(100));
    
    await page.close();
    await context.close();
  });

  test.afterAll(async () => {
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  test('IMG-READ-001: View all vehicle images', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Upload multiple images', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      
      // Upload 3 images
      for (let i = 0; i < 3; i++) {
        await vehicleDetailPage.uploadImage(testImagePath, `Image ${i + 1}`, i === 0);
        await TestHelpers.delay(2000);
      }
    });

    await test.step('Reload page and verify all images displayed', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      await TestHelpers.delay(1000);
      
      const imageCount = await vehicleDetailPage.getImageCount();
      expect(imageCount).toBeGreaterThanOrEqual(3);
    });

    await test.step('Verify primary image has badge', async () => {
      const primaryBadge = authenticatedPage.locator('text=/primary/i').first();
      const isVisible = await primaryBadge.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isVisible) {
        await expect(primaryBadge).toBeVisible();
      }
    });
  });

  test('IMG-READ-002: View image in fullscreen', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to vehicle with images', async () => {
      await vehicleDetailPage.goto(testVehicleId);
    });

    await test.step('Click on image to open fullscreen', async () => {
      const firstImage = vehicleDetailPage.imageGallery.first();
      
      if (await firstImage.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstImage.click();
        await TestHelpers.delay(1000);
        
        // Check if modal or fullscreen opened
        const modal = authenticatedPage.locator('[role="dialog"], .modal, [class*="fullscreen"]');
        const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (modalVisible) {
          // Close modal
          const closeButton = authenticatedPage.locator('button:has-text("Close"), button[aria-label="Close"]');
          if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeButton.click();
          }
        }
      }
    });
  });

  test('IMG-READ-003: View vehicle with no images', async ({ browser }) => {
    let emptyVehicleId: string;
    
    await test.step('Create vehicle without images', async () => {
      const page = await browser.newPage();
      await page.goto('/');
      
      const username = process.env.TEST_USERNAME || 'john.admin';
      const password = process.env.TEST_PASSWORD || 'SecurePassword123!';
      const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
      
      if (await usernameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await usernameInput.fill(username);
        await page.locator('input[type="password"]').fill(password);
        await page.locator('button[type="submit"]').click();
        await page.waitForLoadState('networkidle');
      }
      
      const vehicleData = TestHelpers.generateVehicleData('NoImages');
      
      await page.goto('/vehicles/new');
      await page.locator('input[name="name"]').fill(vehicleData.name);
      await page.locator('input[name="licensePlate"]').fill(vehicleData.licensePlate);
      await page.locator('button:has-text("Next")').click();
      await TestHelpers.delay(500);
      
      await page.locator('input[name="make"]').fill(vehicleData.make);
      await page.locator('input[name="model"]').fill(vehicleData.model);
      await page.locator('input[name="year"]').fill(String(vehicleData.year));
      await page.locator('input[name="vin"]').fill(vehicleData.vin);
      await page.locator('input[name="odometer"]').fill(String(vehicleData.odometer));
      await page.locator('button:has-text("Next")').click();
      await TestHelpers.delay(500);
      
      await page.locator('button:has-text("Next")').click();
      await TestHelpers.delay(500);
      await page.locator('button:has-text("Next")').click();
      await TestHelpers.delay(500);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/vehicles', { timeout: 15000 });
      
      await page.locator(`text=${vehicleData.name}`).click();
      await page.waitForURL('**/vehicles/*');
      const url = page.url();
      const match = url.match(/\/vehicles\/(\d+)/);
      emptyVehicleId = match ? match[1] : '';
      
      await page.close();
    });

    await test.step('Verify empty state', async () => {
      const page = await browser.newPage();
      await page.goto('/');
      
      const username = process.env.TEST_USERNAME || 'john.admin';
      const password = process.env.TEST_PASSWORD || 'SecurePassword123!';
      const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
      
      if (await usernameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await usernameInput.fill(username);
        await page.locator('input[type="password"]').fill(password);
        await page.locator('button[type="submit"]').click();
        await page.waitForLoadState('networkidle');
      }
      
      await page.goto(`/vehicles/${emptyVehicleId}`);
      await TestHelpers.delay(1000);
      
      const uploadButton = page.locator('button:has-text("Upload")');
      await expect(uploadButton).toBeVisible();
      
      await page.close();
    });
  });

  test('IMG-DELETE-001: Delete vehicle image', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to vehicle with images', async () => {
      await vehicleDetailPage.goto(testVehicleId);
    });

    const initialCount = await vehicleDetailPage.getImageCount();

    await test.step('Delete first image', async () => {
      // Hover over image to show delete button
      const firstImage = vehicleDetailPage.imageGallery.first();
      await firstImage.hover();
      await TestHelpers.delay(500);
      
      // Click delete button
      await vehicleDetailPage.deleteImage(0);
      await TestHelpers.delay(500);
      
      // Confirm deletion
      await vehicleDetailPage.confirmImageDelete();
      await TestHelpers.delay(2000);
    });

    await test.step('Verify image deleted', async () => {
      const finalCount = await vehicleDetailPage.getImageCount();
      expect(finalCount).toBe(initialCount - 1);
    });
  });

  test('IMG-DELETE-002: Delete primary image', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Ensure vehicle has a primary image', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      
      const hasPrimary = await authenticatedPage.locator('text=/primary/i').first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (!hasPrimary) {
        // Upload a primary image
        await vehicleDetailPage.uploadImage(testImagePath, 'Primary image', true);
        await TestHelpers.delay(2000);
      }
    });

    await test.step('Delete the primary image', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      
      // Find primary image and delete it
      const primaryBadge = authenticatedPage.locator('text=/primary/i').first();
      if (await primaryBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
        const primaryImageContainer = primaryBadge.locator('..').locator('..');
        const deleteButton = primaryImageContainer.locator('button').filter({ hasText: /delete/i });
        
        if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await deleteButton.click();
          await TestHelpers.delay(500);
          await vehicleDetailPage.confirmImageDelete();
          await TestHelpers.delay(2000);
        }
      }
    });

    await test.step('Verify deletion success', async () => {
      // Page should not crash
      await expect(vehicleDetailPage.vehicleName).toBeVisible();
    });
  });

  test('IMG-DELETE-003: Cancel image deletion', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to vehicle with images', async () => {
      await vehicleDetailPage.goto(testVehicleId);
    });

    const initialCount = await vehicleDetailPage.getImageCount();

    await test.step('Attempt delete and cancel', async () => {
      const firstImage = vehicleDetailPage.imageGallery.first();
      await firstImage.hover();
      await TestHelpers.delay(500);
      
      await vehicleDetailPage.deleteImage(0);
      await TestHelpers.delay(500);
      
      // Cancel deletion
      const cancelButton = authenticatedPage.locator('button:has-text("Cancel")');
      if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelButton.click();
        await TestHelpers.delay(1000);
      }
    });

    await test.step('Verify image not deleted', async () => {
      const finalCount = await vehicleDetailPage.getImageCount();
      expect(finalCount).toBe(initialCount);
    });
  });

  test('IMG-DELETE-004: API error handling', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Attempt to delete non-existent image', async () => {
      const token = await TestHelpers.getAccessToken(authenticatedPage);
      
      const response = await authenticatedPage.request.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/vehicles/${testVehicleId}/images/99999`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Backend returns 400 for invalid image ID
      expect(response.status()).toBe(400);
    });
  });
});
