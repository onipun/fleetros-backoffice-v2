import { expect, test } from '../fixtures/test-fixtures';

/**
 * Test Suite: Authentication & Setup
 * Covers scenarios: AUTH-001, AUTH-002
 */
test.describe('Authentication & Setup', () => {
  test('AUTH-001: Login with valid credentials', async ({ page, loginPage }) => {
    await test.step('Navigate to Fleetros landing page', async () => {
      await loginPage.goto();
      // Verify "Sign in with Keycloak" button is visible
      await expect(loginPage.signInWithKeycloakButton).toBeVisible({ timeout: 5000 });
    });

    await test.step('Click "Sign in with Keycloak" and authenticate', async () => {
      const username = process.env.TEST_USERNAME || 'john.admin';
      const password = process.env.TEST_PASSWORD || 'a123456A!';
      
      // This will: 1) Click Keycloak button, 2) Enter credentials on Keycloak page, 3) Submit
      await loginPage.login(username, password);
    });

    await test.step('Verify successful authentication and redirect', async () => {
      // Wait for redirect away from Keycloak (any page that's not Keycloak auth)
      await page.waitForURL(url => !url.toString().includes('/protocol/openid-connect/'), { timeout: 15000 });
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('domcontentloaded');
      
      // Log current URL for debugging
      console.log('Redirected to:', page.url());
      
      // Verify we're logged in by checking for navigation elements or redirect to onboarding
      const isOnVehiclesOrDashboard = page.url().includes('/vehicles') || page.url().includes('/dashboard');
      const isOnOnboarding = page.url().includes('/onboarding');
      const hasNavigation = await page.locator('[href="/vehicles"], nav, header').first().isVisible({ timeout: 5000 }).catch(() => false);
      
      expect(isOnVehiclesOrDashboard || isOnOnboarding || hasNavigation).toBeTruthy();
    });
  });

  test('AUTH-002: Verify user has vehicle permissions', async ({ authenticatedPage }) => {
    await test.step('Navigate to vehicles page', async () => {
      await authenticatedPage.goto('/vehicles');
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      // Log current URL for debugging
      console.log('AUTH-002 - Current URL:', authenticatedPage.url());
      
      // Allow for onboarding redirect or direct access to vehicles
      const isOnVehicles = authenticatedPage.url().includes('/vehicles');
      const isOnOnboarding = authenticatedPage.url().includes('/onboarding');
      
      // If on onboarding, complete it or skip to vehicles
      if (isOnOnboarding) {
        console.log('User on onboarding page, attempting to navigate to vehicles');
        await authenticatedPage.goto('/vehicles', { waitUntil: 'domcontentloaded' });
      }
      
      expect(isOnVehicles || isOnOnboarding).toBeTruthy();
    });

    await test.step('Verify CAR_READ permission', async () => {
      // Wait for page content to load
      await authenticatedPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      // Should be able to see vehicles page content (heading, list, or add button)
      const vehiclesHeading = authenticatedPage.locator('h1, h2').filter({ hasText: /vehicles?/i });
      const vehiclesList = authenticatedPage.locator('[data-testid*="vehicle"], .vehicle-card, .vehicle-item');
      const addButton = authenticatedPage.locator('a[href="/vehicles/new"], button:has-text("Add Vehicle"), a:has-text("Add Vehicle")');
      
      // At least one of these should be visible indicating CAR_READ permission
      const hasReadAccess = await Promise.race([
        vehiclesHeading.first().isVisible({ timeout: 5000 }).catch(() => false),
        vehiclesList.first().isVisible({ timeout: 5000 }).catch(() => false),
        addButton.first().isVisible({ timeout: 5000 }).catch(() => false),
      ]);
      
      expect(hasReadAccess).toBeTruthy();
    });

    await test.step('Verify CAR_WRITE permission', async () => {
      // Should see Add Vehicle button or link
      const addButton = authenticatedPage.locator('a[href="/vehicles/new"], button:has-text("Add Vehicle"), a:has-text("Add Vehicle")');
      
      // Wait for the button to be visible
      await expect(addButton.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
