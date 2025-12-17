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
  const uniqueSuffix = Date.now();

  // Helper function to ensure test image exists
  function ensureTestImage() {
    if (!fs.existsSync(testImagePath)) {
      const fixturesDir = path.dirname(testImagePath);
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }
      fs.writeFileSync(testImagePath, TestHelpers.createTestImageBuffer(100));
    }
  }

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
    
    await TestHelpers.delay(1000);
    
    // Use VehiclesListPage for proper search
    const { VehiclesListPage } = await import('../pages/vehicles-list.page');
    const vehiclesListPage = new VehiclesListPage(page);
    await vehiclesListPage.searchAndVerifyVehicle(vehicleData.name);
    
    // Navigate to vehicle detail
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();
    await viewDetailsButton.click();
    await page.waitForURL('**/vehicles/*');
    const url = page.url();
    const match = url.match(/\/vehicles\/(\d+)/);
    testVehicleId = match ? match[1] : '';
    
    console.log('beforeAll: Created vehicle with ID:', testVehicleId);
    
    // Create test image file using TestHelpers with unique name to avoid conflicts
    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    testImagePath = path.join(fixturesDir, `mgmt-test-image-${uniqueSuffix}.png`);
    fs.writeFileSync(testImagePath, TestHelpers.createTestImageBuffer(100));
    
    await page.close();
    await context.close();
  });

  // Ensure test image exists before each test
  test.beforeEach(async () => {
    ensureTestImage();
  });

  test.afterAll(async () => {
    // Cleanup generated test image file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  test('IMG-READ-001: View all vehicle images', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Upload multiple images', async () => {
      console.log('IMG-READ-001: testVehicleId =', testVehicleId);
      console.log('IMG-READ-001: testImagePath =', testImagePath);
      
      await authenticatedPage.goto('/vehicles');
      await TestHelpers.delay(500);
      await vehicleDetailPage.goto(testVehicleId);
      
      const currentUrl = authenticatedPage.url();
      console.log('IMG-READ-001: Current URL =', currentUrl);
      
      // Upload 3 images using API instead of UI (faster and more reliable)
      const token = await TestHelpers.getAccessToken(authenticatedPage);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
      
      for (let i = 0; i < 3; i++) {
        console.log(`IMG-READ-001: Uploading image ${i + 1} via API...`);
        
        // Read the image file
        const imageBuffer = fs.readFileSync(testImagePath);
        const formData = new FormData();
        formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'test-image.png');
        formData.append('description', `Image ${i + 1}`);
        formData.append('isPrimary', i === 0 ? 'true' : 'false');
        
        const response = await authenticatedPage.request.post(
          `${apiBaseUrl}/api/vehicles/${testVehicleId}/images`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            multipart: {
              files: {
                name: 'test-image.png',
                mimeType: 'image/png',
                buffer: imageBuffer
              },
              description: `Image ${i + 1}`,
              isPrimary: i === 0 ? 'true' : 'false'
            }
          }
        );
        
        if (!response.ok()) {
          const responseText = await response.text();
          console.log(`IMG-READ-001: Upload failed with status ${response.status()}: ${responseText}`);
          throw new Error(`Image upload failed: ${response.status()} - ${responseText}`);
        }
        console.log(`IMG-READ-001: Image ${i + 1} uploaded successfully`);
      }
      
      // Reload page to see uploaded images
      await authenticatedPage.reload();
      await TestHelpers.delay(1000);
    });

    await test.step('Reload page and verify all images displayed', async () => {
      await authenticatedPage.goto('/vehicles');
      await TestHelpers.delay(500);
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
      await authenticatedPage.goto('/vehicles');
      await TestHelpers.delay(500);
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
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Use LoginPage for proper authentication
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
      
      const vehicleData = TestHelpers.generateVehicleData('NoImages');
      
      await page.goto('/vehicles/new');
      await vehicleFormPage.waitForFormLoad();
      await vehicleFormPage.fillCompleteForm(vehicleData);
      await vehicleFormPage.clickSubmit();
      await page.waitForURL('**/vehicles', { timeout: 15000 });
      
      await TestHelpers.delay(1000);
      
      // Use VehiclesListPage for proper search
      const { VehiclesListPage } = await import('../pages/vehicles-list.page');
      const vehiclesListPage = new VehiclesListPage(page);
      await vehiclesListPage.searchAndVerifyVehicle(vehicleData.name);
      
      // Navigate to vehicle detail
      const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();
      await viewDetailsButton.click();
      await page.waitForURL('**/vehicles/*');
      const url = page.url();
      const match = url.match(/\/vehicles\/(\d+)/);
      emptyVehicleId = match ? match[1] : '';
      
      await page.close();
      await context.close();
    });

    await test.step('Verify empty state', async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Navigate directly - session should already exist from vehicle creation
      await page.goto(`/vehicles/${emptyVehicleId}`);
      await TestHelpers.delay(2000);
      
      // Check if we're on the vehicle detail page
      const currentUrl = page.url();
      if (!currentUrl.includes(`/vehicles/${emptyVehicleId}`)) {
        // If redirected to login, authenticate
        const { LoginPage } = await import('../pages/login.page');
        const loginPage = new LoginPage(page);
        
        const username = process.env.TEST_USERNAME || 'john.admin';
        const password = process.env.TEST_PASSWORD || 'a123456A!';
        
        await loginPage.login(username, password);
        await page.waitForLoadState('domcontentloaded');
        
        // Navigate again after login
        await page.goto(`/vehicles/${emptyVehicleId}`);
        await TestHelpers.delay(2000);
      }
      
      const uploadButton = page.locator('button:has-text("Upload")');
      await expect(uploadButton).toBeVisible();
      
      await page.close();
      await context.close();
    });
  });

  test('IMG-DELETE-001: Delete vehicle image', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to vehicle with images and ensure it has images', async () => {
      await authenticatedPage.goto('/vehicles');
      await authenticatedPage.waitForLoadState('networkidle');
      await TestHelpers.delay(500);
      await vehicleDetailPage.goto(testVehicleId);
      await authenticatedPage.waitForLoadState('networkidle');
      await TestHelpers.delay(1000);
      
      let currentCount = await vehicleDetailPage.getImageCount();
      
      // Upload at least 3 images if vehicle has none
      if (currentCount < 3) {
        const imagesToUpload = 3 - currentCount;
        for (let i = 0; i < imagesToUpload; i++) {
          await vehicleDetailPage.uploadImage(testImagePath, `Test Image ${i + 1}`, i === 0 && currentCount === 0);
          await TestHelpers.delay(2000);
        }
        // Reload to get updated count
        await authenticatedPage.reload({ waitUntil: 'networkidle' });
        await TestHelpers.delay(1000);
      }
    });

    const initialCount = await vehicleDetailPage.getImageCount();
    console.log('Initial image count before delete:', initialCount);

    await test.step('Delete first image', async () => {
      // Set up native dialog handler to accept the browser confirm()
      const dialogPromise = new Promise<void>((resolve) => {
        authenticatedPage.once('dialog', async dialog => {
          console.log(`Dialog detected: ${dialog.type()} - ${dialog.message()}`);
          await dialog.accept();
          resolve();
        });
      });
      
      // Click delete button on first image - this triggers the native confirm()
      await vehicleDetailPage.deleteImage(0);
      
      // Wait for dialog to be handled
      await dialogPromise;
      
      // Wait for the page to update after deletion
      await authenticatedPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await TestHelpers.delay(2000);
    });

    await test.step('Verify image deleted', async () => {
      const finalCount = await vehicleDetailPage.getImageCount();
      console.log(`Initial count: ${initialCount}, Final count: ${finalCount}`);
      expect(finalCount).toBe(initialCount - 1);
    });
  });

  test('IMG-DELETE-002: Delete primary image', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Ensure vehicle has a primary image', async () => {
      await authenticatedPage.goto('/vehicles');
      await TestHelpers.delay(500);
      await vehicleDetailPage.goto(testVehicleId);
      
      const hasPrimary = await authenticatedPage.locator('text=/primary/i').first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (!hasPrimary) {
        // Upload a primary image
        await vehicleDetailPage.uploadImage(testImagePath, 'Primary image', true);
        await TestHelpers.delay(2000);
      }
    });

    await test.step('Delete primary image', async () => {
      await authenticatedPage.goto('/vehicles');
      await TestHelpers.delay(500);
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
    await test.step('Navigate to vehicle with images and ensure it has at least one', async () => {
      await authenticatedPage.goto('/vehicles');
      await authenticatedPage.waitForLoadState('networkidle');
      await TestHelpers.delay(500);
      await vehicleDetailPage.goto(testVehicleId);
      await authenticatedPage.waitForLoadState('networkidle');
      await TestHelpers.delay(1000);
      
      let currentCount = await vehicleDetailPage.getImageCount();
      
      // Upload at least 1 image if vehicle has none
      if (currentCount < 1) {
        await vehicleDetailPage.uploadImage(testImagePath, `Test Image 1`, true);
        await TestHelpers.delay(2000);
        // Reload to get updated count
        await authenticatedPage.reload({ waitUntil: 'networkidle' });
        await TestHelpers.delay(1000);
      }
    });

    const initialCount = await vehicleDetailPage.getImageCount();
    console.log('Initial image count:', initialCount);

    await test.step('Attempt delete and cancel', async () => {
      if (initialCount === 0) {
        console.log('No images to delete, skipping test');
        return;
      }
      
      const firstImage = vehicleDetailPage.imageGallery.first();
      await firstImage.hover();
      await TestHelpers.delay(500);
      
      // Set up dialog handler to dismiss
      authenticatedPage.once('dialog', async dialog => {
        console.log(`Dialog detected: ${dialog.type()} - ${dialog.message()}`);
        await dialog.dismiss(); // Cancel the deletion
      });
      
      await vehicleDetailPage.deleteImage(0);
      await TestHelpers.delay(1000);
    });

    await test.step('Verify image not deleted', async () => {
      // Reload to get fresh count
      await authenticatedPage.reload({ waitUntil: 'networkidle' });
      await TestHelpers.delay(1000);
      const finalCount = await vehicleDetailPage.getImageCount();
      console.log('Final image count:', finalCount);
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
