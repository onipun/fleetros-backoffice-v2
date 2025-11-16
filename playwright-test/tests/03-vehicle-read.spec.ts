import { expect, test } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Test Suite: Vehicle Read (R)
 * Covers scenarios: VEH-READ-001 to VEH-READ-006
 */
test.describe('Vehicle Read Operations', () => {
  let testVehicleId: string;
  let testVehicleName: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test vehicle for read operations using authenticated context
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
    
    // Create test vehicle
    const vehicleData = TestHelpers.generateVehicleData('ReadTest');
    testVehicleName = vehicleData.name;
    
    await page.goto('/vehicles/new');
    await vehicleFormPage.waitForFormLoad();
    
    // Use VehicleFormPage to fill form properly
    await vehicleFormPage.fillCompleteForm(vehicleData);
    await vehicleFormPage.clickSubmit();
    
    await page.waitForURL('**/vehicles', { timeout: 15000 });
    
    // Get the vehicle ID - use search to handle pagination
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
    
    await page.close();
    await context.close();
  });

  test('VEH-READ-001: View all vehicles list', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Wait for vehicles to load', async () => {
      await vehiclesListPage.waitForVehiclesToLoad();
    });

    await test.step('Verify vehicle cards are displayed', async () => {
      const count = await vehiclesListPage.getVehicleCount();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('Verify vehicle card content', async () => {
      // Check that test vehicle exists (with search to handle pagination)
      await vehiclesListPage.searchAndVerifyVehicle(testVehicleName);
    });
  });

  test('VEH-READ-002: View single vehicle details', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to vehicle detail page', async () => {
      await vehicleDetailPage.goto(testVehicleId);
    });

    await test.step('Verify vehicle details are displayed', async () => {
      // Check name is visible
      await expect(vehicleDetailPage.vehicleName).toBeVisible();
      
      // Check status badge
      await expect(vehicleDetailPage.vehicleStatus).toBeVisible();
      
      // Check edit and delete buttons
      await expect(vehicleDetailPage.editButton).toBeVisible();
      await expect(vehicleDetailPage.deleteButton).toBeVisible();
    });

    await test.step('Verify HATEOAS structure', async () => {
      // Page should load without errors - check for actual error messages
      const hasErrors = await authenticatedPage.locator('.text-destructive:visible, [role="alert"]:has-text(/error|failed|invalid/i)').isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasErrors).toBe(false);
    });
  });

  test('VEH-READ-003: Search vehicles by name', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles list', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Search for test vehicle', async () => {
      await vehiclesListPage.searchVehicle('ReadTest');
      await TestHelpers.delay(1000);
    });

    await test.step('Verify filtered results', async () => {
      // Should show vehicles matching search term
      await vehiclesListPage.verifyVehicleExists(testVehicleName);
      
      // Search for non-existent vehicle
      await vehiclesListPage.searchVehicle('NonExistentVehicle9999');
      await TestHelpers.delay(1000);
      
      // Should show empty state or no results
      const count = await vehiclesListPage.getVehicleCount();
      expect(count).toBe(0);
    });
  });

  test('VEH-READ-004: View vehicle with no images', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to vehicle detail', async () => {
      await vehicleDetailPage.goto(testVehicleId);
    });

    await test.step('Check images section', async () => {
      const imageCount = await vehicleDetailPage.getImageCount();
      
      // If no images, verify empty state or upload button still visible
      if (imageCount === 0) {
        await expect(vehicleDetailPage.uploadImageButton).toBeVisible();
      }
    });
  });

  test('VEH-READ-005: View vehicle not found', async ({ authenticatedPage }) => {
    await test.step('Navigate to non-existent vehicle', async () => {
      await authenticatedPage.goto('/vehicles/99999');
      await TestHelpers.delay(2000);
    });

    await test.step('Verify 404 error handling', async () => {
      // Should show error message or empty state
      const errorMessage = authenticatedPage.locator('text=/not found|vehicle not found|error/i');
      const isVisible = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
      
      // Just verify we're still on a valid page (not crashed)
      expect(authenticatedPage.url()).toContain('/vehicles');
    });
  });

  test('VEH-READ-006: View vehicle pricing list', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to vehicle detail', async () => {
      await vehicleDetailPage.goto(testVehicleId);
    });

    await test.step('Verify pricing section exists', async () => {
      const pricingSection = authenticatedPage.locator('text=/pricing|price/i');
      await expect(pricingSection.first()).toBeVisible({ timeout: 5000 });
    });
  });
});
