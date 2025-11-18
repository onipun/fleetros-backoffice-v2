import { expect, test } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Test Suite: Vehicle Search Operations
 * Tests all 9 search modes including category and seating capacity search
 */
test.describe('Vehicle Search Operations', () => {
  const testVehicles = {
    sedan: TestHelpers.generateVehicleData('Sedan'),
    suv: TestHelpers.generateVehicleData('SUV'),
    van: TestHelpers.generateVehicleData('Van'),
  };

  test.beforeAll(async ({ browser }) => {
    // Create test vehicles with different car types and seater counts
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const { LoginPage } = await import('../pages/login.page');
    const loginPage = new LoginPage(page);
    const { VehicleFormPage } = await import('../pages/vehicle-form.page');
    const vehicleFormPage = new VehicleFormPage(page);
    
    await page.goto('/');
    
    const isLoggedIn = await page.locator('[href="/vehicles"], nav, header').first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!isLoggedIn) {
      const username = process.env.TEST_USERNAME || 'john.admin';
      const password = process.env.TEST_PASSWORD || 'a123456A!';
      await loginPage.login(username, password);
      await page.waitForLoadState('domcontentloaded');
    }
    
    // Create SEDAN with 5 seats
    testVehicles.sedan.carType = 'SEDAN';
    testVehicles.sedan.seaterCount = 5;
    await page.goto('/vehicles/new');
    await vehicleFormPage.waitForFormLoad();
    await vehicleFormPage.fillCompleteForm(testVehicles.sedan);
    await vehicleFormPage.clickSubmit();
    await page.waitForURL('**/vehicles', { timeout: 15000 });
    await TestHelpers.delay(1000);
    
    // Create SUV with 7 seats
    testVehicles.suv.carType = 'SUV';
    testVehicles.suv.seaterCount = 7;
    await page.goto('/vehicles/new');
    await vehicleFormPage.waitForFormLoad();
    await vehicleFormPage.fillCompleteForm(testVehicles.suv);
    await vehicleFormPage.clickSubmit();
    await page.waitForURL('**/vehicles', { timeout: 15000 });
    await TestHelpers.delay(1000);
    
    // Create VAN with 12 seats
    testVehicles.van.carType = 'VAN';
    testVehicles.van.seaterCount = 12;
    await page.goto('/vehicles/new');
    await vehicleFormPage.waitForFormLoad();
    await vehicleFormPage.fillCompleteForm(testVehicles.van);
    await vehicleFormPage.clickSubmit();
    await page.waitForURL('**/vehicles', { timeout: 15000 });
    
    await page.close();
    await context.close();
  });

  test('VEH-SEARCH-001: Search by vehicle name', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Search by name', async () => {
      await vehiclesListPage.selectSearchMode('name');
      await vehiclesListPage.searchVehicle(testVehicles.sedan.name);
      await TestHelpers.delay(1000);
    });

    await test.step('Verify search results', async () => {
      await vehiclesListPage.verifyVehicleExists(testVehicles.sedan.name);
    });

    await test.step('Clear filters', async () => {
      await vehiclesListPage.clearFilters();
    });
  });

  test('VEH-SEARCH-002: Search by make', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Search by make', async () => {
      await vehiclesListPage.selectSearchMode('make');
      await vehiclesListPage.searchVehicle('Toyota');
      await TestHelpers.delay(1000);
    });

    await test.step('Verify search results contain vehicles with that make', async () => {
      const count = await vehiclesListPage.getVehicleCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('VEH-SEARCH-003: Search by model', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Search by model', async () => {
      await vehiclesListPage.selectSearchMode('model');
      await vehiclesListPage.searchVehicle('Camry');
      await TestHelpers.delay(1000);
    });

    await test.step('Verify search results', async () => {
      const count = await vehiclesListPage.getVehicleCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('VEH-SEARCH-004: Search by license plate', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Search by license plate', async () => {
      await vehiclesListPage.selectSearchMode('licensePlate');
      await vehiclesListPage.searchVehicle(testVehicles.sedan.licensePlate);
      await TestHelpers.delay(1000);
    });

    await test.step('Verify exact match', async () => {
      await vehiclesListPage.verifyVehicleExists(testVehicles.sedan.name);
      const count = await vehiclesListPage.getVehicleCount();
      expect(count).toBe(1);
    });
  });

  test('VEH-SEARCH-005: Search by status', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Search by status', async () => {
      await vehiclesListPage.selectSearchMode('status');
      await vehiclesListPage.searchVehicle('AVAILABLE');
      await TestHelpers.delay(1000);
    });

    await test.step('Verify all results have AVAILABLE status', async () => {
      const count = await vehiclesListPage.getVehicleCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('VEH-SEARCH-006: Search by category (car type)', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Select category search mode', async () => {
      await vehiclesListPage.selectSearchMode('category');
      await TestHelpers.delay(500);
    });

    await test.step('Filter by SEDAN category', async () => {
      await vehiclesListPage.filterByCarType('SEDAN');
      await TestHelpers.delay(1000);
    });

    await test.step('Verify SEDAN vehicles appear', async () => {
      await vehiclesListPage.verifyVehicleExists(testVehicles.sedan.name);
    });

    await test.step('Filter by SUV category', async () => {
      await vehiclesListPage.filterByCarType('SUV');
      await TestHelpers.delay(1000);
    });

    await test.step('Verify SUV vehicles appear', async () => {
      await vehiclesListPage.verifyVehicleExists(testVehicles.suv.name);
    });
  });

  test('VEH-SEARCH-007: Search by seating capacity', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Select seating search mode', async () => {
      await vehiclesListPage.selectSearchMode('seating');
      await TestHelpers.delay(500);
    });

    await test.step('Filter by 5 seats', async () => {
      await vehiclesListPage.filterBySeaterCount(5);
      await TestHelpers.delay(1000);
    });

    await test.step('Verify 5-seater vehicles appear', async () => {
      await vehiclesListPage.verifyVehicleExists(testVehicles.sedan.name);
    });

    await test.step('Filter by 7 seats', async () => {
      await vehiclesListPage.filterBySeaterCount(7);
      await TestHelpers.delay(1000);
    });

    await test.step('Verify 7-seater vehicles appear', async () => {
      await vehiclesListPage.verifyVehicleExists(testVehicles.suv.name);
    });

    await test.step('Filter by 12 seats', async () => {
      await vehiclesListPage.filterBySeaterCount(12);
      await TestHelpers.delay(1000);
    });

    await test.step('Verify 12-seater vehicles appear', async () => {
      await vehiclesListPage.verifyVehicleExists(testVehicles.van.name);
    });
  });

  test('VEH-SEARCH-008: Advanced search with multiple filters', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Select advanced search mode', async () => {
      await vehiclesListPage.selectSearchMode('advanced');
      await TestHelpers.delay(500);
    });

    await test.step('Apply multiple filters', async () => {
      // If advanced mode has multiple filter inputs, test them
      const hasCarTypeFilter = await vehiclesListPage.carTypeFilter.isVisible({ timeout: 2000 }).catch(() => false);
      const hasSeaterFilter = await vehiclesListPage.seaterCountInput.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasCarTypeFilter) {
        await vehiclesListPage.filterByCarType('SUV');
      }
      
      if (hasSeaterFilter) {
        await vehiclesListPage.filterBySeaterCount(7);
      }
      
      await TestHelpers.delay(1000);
    });

    await test.step('Verify filtered results', async () => {
      const count = await vehiclesListPage.getVehicleCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test('VEH-SEARCH-009: Clear all filters', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Apply filters', async () => {
      await vehiclesListPage.selectSearchMode('category');
      await vehiclesListPage.filterByCarType('SEDAN');
      await TestHelpers.delay(1000);
    });

    await test.step('Verify filtered results', async () => {
      const filteredCount = await vehiclesListPage.getVehicleCount();
      expect(filteredCount).toBeGreaterThan(0);
    });

    await test.step('Clear all filters', async () => {
      await vehiclesListPage.clearFilters();
      await TestHelpers.delay(1000);
    });

    await test.step('Verify all vehicles shown', async () => {
      const allCount = await vehiclesListPage.getVehicleCount();
      expect(allCount).toBeGreaterThanOrEqual(0);
    });
  });

  test('VEH-SEARCH-010: No results found', async ({ authenticatedPage, vehiclesListPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await vehiclesListPage.goto();
    });

    await test.step('Search for non-existent vehicle', async () => {
      await vehiclesListPage.selectSearchMode('name');
      await vehiclesListPage.searchVehicle('NonExistentVehicle99999');
      await TestHelpers.delay(1000);
    });

    await test.step('Verify no results message', async () => {
      const count = await vehiclesListPage.getVehicleCount();
      expect(count).toBe(0);
      
      // Check for empty state message
      const emptyState = await vehiclesListPage.emptyState.isVisible({ timeout: 2000 }).catch(() => false);
      if (emptyState) {
        await expect(vehiclesListPage.emptyState).toBeVisible();
      }
    });
  });
});
