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

    await test.step('Click delete button', async () => {
      await vehicleDetailPage.clickDelete();
    });

    await test.step('Confirm deletion', async () => {
      // Wait for confirmation dialog
      await TestHelpers.delay(500);
      await vehicleDetailPage.confirmDelete();
    });

    await test.step('Verify deletion success', async () => {
      // Should be redirected to vehicles list
      await authenticatedPage.waitForURL('**/vehicles', { timeout: 15000 });
      
      // Verify success message
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|deleted/i);
      
      // Verify vehicle no longer exists in list
      await TestHelpers.delay(1000);
      const vehicleCard = authenticatedPage.locator(`text=${vehicleName}`);
      const isVisible = await vehicleCard.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(false);
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
      await vehicleDetailPage.clickDelete();
      await TestHelpers.delay(500);
      await vehicleDetailPage.cancelDelete();
    });

    await test.step('Verify vehicle still exists', async () => {
      // Should still be on detail page
      expect(authenticatedPage.url()).toContain(`/vehicles/${vehicleId}`);
      
      // Vehicle name should still be visible
      await expect(authenticatedPage.locator(`text=${vehicleName}`)).toBeVisible();
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
