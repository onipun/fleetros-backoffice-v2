import { expect, test } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Test Suite: Vehicle Delete (D)
 * Covers scenarios: VEH-DELETE-001 to VEH-DELETE-007
 */
test.describe('Vehicle Delete Operations', () => {
  test('VEH-DELETE-001: Delete vehicle successfully', async ({ authenticatedPage, vehicleDetailPage, vehicleFormPage }) => {
    let vehicleId: string;
    let vehicleName: string;

    await test.step('Create test vehicle', async () => {
      const vehicleData = TestHelpers.generateVehicleData('DeleteTest');
      vehicleName = vehicleData.name;
      
      await authenticatedPage.goto('/vehicles/new');
      await vehicleFormPage.fillCompleteForm(vehicleData);
      await vehicleFormPage.clickSubmit();
      await authenticatedPage.waitForURL('**/vehicles', { timeout: 15000 });
      
      // Search and navigate to the vehicle
      await TestHelpers.delay(1000);
      const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="Search"]');
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.clear();
        await searchInput.fill(vehicleData.name);
        await TestHelpers.delay(500);
      }
      
      const viewDetailsButton = authenticatedPage.locator('button:has-text("View Details"), a:has-text("View Details")').first();
      await viewDetailsButton.click();
      await authenticatedPage.waitForURL('**/vehicles/*');
      const url = authenticatedPage.url();
      const match = url.match(/\/vehicles\/(\d+)/);
      vehicleId = match ? match[1] : '';
    });

    await test.step('Delete vehicle and confirm', async () => {
      // confirmDelete handles clicking delete button and accepting the native browser dialog
      await vehicleDetailPage.confirmDelete();
    });

    await test.step('Verify deletion success', async () => {
      // Should be redirected to vehicles list
      await authenticatedPage.waitForURL('**/vehicles', { timeout: 15000 });
      
      // Verify success message
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|deleted/i);
      
      // Verify vehicle no longer exists by trying to navigate to it directly
      await TestHelpers.delay(1000);
      await authenticatedPage.goto(`/vehicles/${vehicleId}`);
      await TestHelpers.delay(2000);
      
      // Should show error or redirect to list page
      const currentUrl = authenticatedPage.url();
      const isOnDetailPage = currentUrl.includes(`/vehicles/${vehicleId}`) && !currentUrl.includes('/vehicles/new');
      
      // If still on detail page, check for error message
      if (isOnDetailPage) {
        const errorMessage = authenticatedPage.locator('text=/not found|error/i');
        const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasError || !isOnDetailPage).toBe(true);
      } else {
        // Redirected away from detail page - deletion successful
        expect(isOnDetailPage).toBe(false);
      }
    });
  });

  test('VEH-DELETE-002: Cancel vehicle deletion', async ({ authenticatedPage, vehicleDetailPage, vehicleFormPage }) => {
    let vehicleId: string;
    let vehicleName: string;

    await test.step('Create test vehicle', async () => {
      const vehicleData = TestHelpers.generateVehicleData('CancelDelete');
      vehicleName = vehicleData.name;
      
      await authenticatedPage.goto('/vehicles/new');
      await vehicleFormPage.fillCompleteForm(vehicleData);
      await vehicleFormPage.clickSubmit();
      await authenticatedPage.waitForURL('**/vehicles', { timeout: 15000 });
      
      // Search and navigate to the vehicle
      await TestHelpers.delay(1000);
      const searchInput = authenticatedPage.locator('input[type="search"], input[placeholder*="Search"]');
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.clear();
        await searchInput.fill(vehicleData.name);
        await TestHelpers.delay(500);
      }
      
      const viewDetailsButton = authenticatedPage.locator('button:has-text("View Details"), a:has-text("View Details")').first();
      await viewDetailsButton.click();
      await authenticatedPage.waitForURL('**/vehicles/*');
      vehicleId = await vehicleDetailPage.getVehicleId();
    });

    await test.step('Click delete and cancel', async () => {
      // cancelDelete handles clicking delete button and dismissing the native browser dialog
      await vehicleDetailPage.cancelDelete();
      await TestHelpers.delay(500);
    });

    await test.step('Verify vehicle still exists', async () => {
      // Should still be on detail page
      expect(authenticatedPage.url()).toContain(`/vehicles/${vehicleId}`);
      
      // Vehicle header should still be visible (using h1 instead of text search)
      await expect(vehicleDetailPage.vehicleName).toBeVisible();
      
      // Edit button should still be available
      await expect(vehicleDetailPage.editButton).toBeVisible();
    });
  });

  test('VEH-DELETE-003: Delete non-existent vehicle', async ({ authenticatedPage }) => {
    await test.step('Send DELETE request to non-existent vehicle', async () => {
      const token = await TestHelpers.getAccessToken(authenticatedPage);
      
      const response = await authenticatedPage.request.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/vehicles/99999`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Backend returns 500 for non-existent vehicle
      expect(response.status()).toBe(500);
    });
  });

  test('VEH-DELETE-004: Unauthorized deletion attempt', async ({ page }) => {
    // This test uses unauthenticated page
    await test.step('Try to access delete endpoint without auth', async () => {
      const response = await page.request.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/vehicles/1`,
        {
          headers: {},
        }
      );
      
      // Should return 401 or 403
      expect([401, 403]).toContain(response.status());
    });
  });
});
