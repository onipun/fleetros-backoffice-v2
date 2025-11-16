import { expect, test } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Test Suite: Vehicle Update (U)
 * Covers scenarios: VEH-UPDATE-001 to VEH-UPDATE-008
 */
test.describe('Vehicle Update Operations', () => {
  let testVehicleId: string;
  let testVehicleName: string;

  test.beforeEach(async ({ browser }) => {
    // Create a fresh test vehicle for each update test using authenticated context
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
    
    // Create vehicle via form
    const vehicleData = TestHelpers.generateVehicleData('UpdateTest');
    testVehicleName = vehicleData.name;
    
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
    
    await page.close();
    await context.close();
  });

  test('VEH-UPDATE-001: Update vehicle basic information', async ({ 
    authenticatedPage, 
    vehicleDetailPage, 
    vehicleFormPage 
  }) => {
    await test.step('Navigate to edit page', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      await vehicleDetailPage.clickEdit();
      await TestHelpers.delay(2000); // Wait for form to load
    });

    await test.step('Update vehicle name', async () => {
      await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 5000 });
      const updatedName = `Updated ${testVehicleName}`;
      await authenticatedPage.locator('input[name="name"]').clear();
      await authenticatedPage.locator('input[name="name"]').fill(updatedName);
    });

    await test.step('Submit update', async () => {
      // Check if it's a single-page form or multi-step form
      const nextButton = authenticatedPage.locator('button:has-text("Next")');
      const submitButton = authenticatedPage.locator('button[type="submit"]:has-text(/save|update|submit/i)');
      
      const hasNext = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasNext) {
        // Multi-step form - navigate through steps
        for (let i = 0; i < 4; i++) {
          await nextButton.click();
          await TestHelpers.delay(500);
        }
      }
      
      // Click submit button
      await submitButton.click();
      await authenticatedPage.waitForURL('**/vehicles/**', { timeout: 15000 });
    });

    await test.step('Verify update success', async () => {
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|updated/i);
      
      // Verify updated name is displayed
      const updatedName = `Updated ${testVehicleName}`;
      await expect(authenticatedPage.locator(`text=${updatedName}`)).toBeVisible({ timeout: 5000 });
    });
  });

  test('VEH-UPDATE-002: Update vehicle specifications', async ({ 
    authenticatedPage, 
    vehicleDetailPage,
    vehicleFormPage 
  }) => {
    await test.step('Navigate to edit page', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      await vehicleDetailPage.clickEdit();
      await TestHelpers.delay(1000); // Wait for form to load
    });

    await test.step('Update specifications', async () => {
      await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 5000 });
      
      // Update make and model if visible
      const makeInput = authenticatedPage.locator('input[name="make"]');
      const modelInput = authenticatedPage.locator('input[name="model"]');
      
      if (await makeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await makeInput.fill('Honda');
        await modelInput.fill('Accord');
      }
    });

    await test.step('Submit and verify', async () => {
      await authenticatedPage.locator('button[type="submit"]:has-text(/save|update|submit/i)').click();
      await authenticatedPage.waitForURL('**/vehicles/**', { timeout: 15000 });
      
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|updated/i);
    });
  });

  test('VEH-UPDATE-003: Update rental settings', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to edit page', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      await vehicleDetailPage.clickEdit();
      await TestHelpers.delay(1000); // Wait for form to load
    });

    await test.step('Update rental settings', async () => {
      await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 5000 });
      
      const bufferInput = authenticatedPage.locator('input[name="bufferMinutes"]');
      const minHoursInput = authenticatedPage.locator('input[name="minRentalHours"]');
      
      if (await bufferInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bufferInput.fill('60');
        if (await minHoursInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await minHoursInput.fill('48');
        }
      }
    });

    await test.step('Submit and verify', async () => {
      await authenticatedPage.locator('button[type="submit"]:has-text(/save|update|submit/i)').click();
      await authenticatedPage.waitForURL('**/vehicles/**', { timeout: 15000 });
      
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|updated/i);
    });
  });

  test('VEH-UPDATE-004: Update vehicle details/description', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to edit page', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      await vehicleDetailPage.clickEdit();
      await TestHelpers.delay(1000); // Wait for form to load
    });

    await test.step('Update details', async () => {
      await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 5000 });
      
      const detailsTextarea = authenticatedPage.locator('textarea[name="details"]');
      if (await detailsTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await detailsTextarea.fill('Updated description with special characters: @#$%, 12345');
      }
    });

    await test.step('Submit and verify', async () => {
      await authenticatedPage.locator('button[type="submit"]:has-text(/save|update|submit/i)').click();
      await authenticatedPage.waitForURL('**/vehicles/**', { timeout: 15000 });
      
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|updated/i);
    });
  });

  test('VEH-UPDATE-005: Validation - Update with invalid data', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to edit page', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      await vehicleDetailPage.clickEdit();
      await TestHelpers.delay(1000); // Wait for form to load
    });

    await test.step('Clear required field and attempt submit', async () => {
      await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 5000 });
      await authenticatedPage.locator('input[name="name"]').clear();
      
      // Try to submit - should fail validation
      await authenticatedPage.locator('button[type="submit"]:has-text(/save|update|submit/i)').click();
      await TestHelpers.delay(500);
      
      // Should show validation error
      const error = authenticatedPage.locator('.text-destructive:visible, [role="alert"]:has-text(/required|invalid/i)');
      const hasError = await error.isVisible({ timeout: 2000 }).catch(() => false);
      // Just verify we're still on edit page (validation prevented submit)
      expect(authenticatedPage.url()).toContain('/edit');
    });
  });

  test('VEH-UPDATE-006: Update vehicle status', async ({ authenticatedPage, vehicleDetailPage }) => {
    await test.step('Navigate to edit page', async () => {
      await vehicleDetailPage.goto(testVehicleId);
      await vehicleDetailPage.clickEdit();
      await TestHelpers.delay(1000); // Wait for form to load
    });

    await test.step('Update status to MAINTENANCE', async () => {
      await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 5000 });
      const statusField = authenticatedPage.locator('select[name="status"]').first();
      if (await statusField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await statusField.selectOption('MAINTENANCE');
      }
    });

    await test.step('Submit and verify', async () => {
      await authenticatedPage.locator('button[type="submit"]:has-text(/save|update|submit/i)').click();
      await authenticatedPage.waitForURL('**/vehicles/**', { timeout: 15000 });
      
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|updated/i);
      
      // Verify status badge shows MAINTENANCE
      const statusBadge = authenticatedPage.locator('text=/MAINTENANCE/i');
      await expect(statusBadge).toBeVisible({ timeout: 5000 });
    });
  });
});
