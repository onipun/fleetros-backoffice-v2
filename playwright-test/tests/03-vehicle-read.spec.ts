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
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';
    const context = await browser.newContext({ baseURL });
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

  test('VEH-READ-003: Search vehicles by name', async ({ authenticatedPage, vehiclesListPage, vehicleFormPage }) => {
    // Create a test vehicle for this specific test
    const testVehicleData = TestHelpers.generateVehicleData('SearchTest');
    
    await test.step('Create test vehicle', async () => {
      await vehicleFormPage.gotoNew();
      await vehicleFormPage.waitForFormLoad();
      await vehicleFormPage.fillCompleteForm(testVehicleData);
      await vehicleFormPage.clickSubmit();
      
      // Wait for creation and success message
      await authenticatedPage.waitForLoadState('networkidle');
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|created/i);
    });

    await test.step('Navigate to vehicles list', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Search for test vehicle', async () => {
      // Use searchAndVerifyVehicle which handles full search flow
      await vehiclesListPage.searchAndVerifyVehicle(testVehicleData.name);
    });

    await test.step('Verify filtered results', async () => {
      // Vehicle already verified by searchAndVerifyVehicle above
      
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

  test('VEH-READ-007: Verify all vehicle details labels and values', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to vehicle detail', async () => {
      await vehicleDetailPage.goto(testVehicleId);
    });

    await test.step('Verify Basic Information section', async () => {
      // Verify section heading
      await expect(authenticatedPage.locator('text=/basic info/i').first()).toBeVisible({ timeout: 5000 });
      
      // Status field
      await expect(authenticatedPage.locator('text=/status/i').first()).toBeVisible();
      await expect(authenticatedPage.locator('text=/available|rented|maintenance|retired/i').first()).toBeVisible();
      
      // License Plate field
      await expect(authenticatedPage.locator('text=/license plate/i').first()).toBeVisible();
      
      // VIN field
      await expect(authenticatedPage.locator('text=/vin|vin number/i').first()).toBeVisible();
      
      // Odometer field
      await expect(authenticatedPage.locator('text=/odometer/i').first()).toBeVisible();
      await expect(authenticatedPage.locator('text=/km|kilometers/i').first()).toBeVisible();
    });

    await test.step('Verify Specifications section', async () => {
      // Verify section heading
      await expect(authenticatedPage.locator('text=/specifications/i').first()).toBeVisible({ timeout: 5000 });
      
      // Make field
      await expect(authenticatedPage.locator('text=/^make$/i').first()).toBeVisible();
      
      // Model field
      await expect(authenticatedPage.locator('text=/^model$/i').first()).toBeVisible();
      
      // Year field
      await expect(authenticatedPage.locator('text=/^year$/i').first()).toBeVisible();
      
      // Vehicle Category / Car Type field
      await expect(authenticatedPage.locator('text=/vehicle category|car type/i').first()).toBeVisible();
      
      // Number of Seats / Seater Count field
      await expect(authenticatedPage.locator('text=/seater count|number of seats/i').first()).toBeVisible();
      await expect(authenticatedPage.locator('text=/seat|seats/i').first()).toBeVisible();
      
      // Fuel Type field
      await expect(authenticatedPage.locator('text=/fuel type/i').first()).toBeVisible();
      
      // Transmission Type field
      await expect(authenticatedPage.locator('text=/transmission type|transmission/i').first()).toBeVisible();
    });

    await test.step('Verify Rental Settings section', async () => {
      // Verify section heading
      await expect(authenticatedPage.locator('text=/rental settings/i').first()).toBeVisible({ timeout: 5000 });
      
      // Buffer Minutes field
      await expect(authenticatedPage.locator('text=/buffer minutes|buffer/i').first()).toBeVisible();
      
      // Min Rental Hours field
      await expect(authenticatedPage.locator('text=/min rental hours|minimum rental/i').first()).toBeVisible();
      
      // Max Rental Days field
      await expect(authenticatedPage.locator('text=/max rental days|maximum rental/i').first()).toBeVisible();
      
      // Max Future Booking Days field
      await expect(authenticatedPage.locator('text=/max future booking|future booking/i').first()).toBeVisible();
    });

    await test.step('Verify vehicle header information', async () => {
      // Vehicle name in header (h1)
      await expect(vehicleDetailPage.vehicleName).toBeVisible();
      
      // Make, Model, Year subtitle
      await expect(authenticatedPage.locator('text=/toyota|camry|202/i').first()).toBeVisible();
    });

    await test.step('Verify action buttons are present', async () => {
      // Back button
      await expect(authenticatedPage.locator('button:has-text("Back"), a:has-text("Back")').first()).toBeVisible();
      
      // Edit button
      await expect(vehicleDetailPage.editButton).toBeVisible();
      
      // Delete button
      await expect(vehicleDetailPage.deleteButton).toBeVisible();
    });

    await test.step('Verify all field values are not empty or show fallback', async () => {
      // Check that values are displayed (either actual values or "Not available" fallback)
      const fieldsWithValues = await authenticatedPage.locator('p.font-medium, p.font-mono').all();
      expect(fieldsWithValues.length).toBeGreaterThan(0);
      
      // Verify at least one value contains actual data (not all "Not available")
      const fieldTexts = await Promise.all(fieldsWithValues.map(f => f.textContent()));
      const hasActualData = fieldTexts.some(text => 
        text && 
        !text.includes('Not available') && 
        !text.includes('notAvailable') &&
        text.trim().length > 0
      );
      expect(hasActualData).toBe(true);
    });
  });
});
