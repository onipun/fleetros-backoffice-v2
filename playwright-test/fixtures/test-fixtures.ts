import { test as base, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LoginPage } from '../pages/login.page';
import { VehicleDetailPage } from '../pages/vehicle-detail.page';
import { VehicleFormPage } from '../pages/vehicle-form.page';
import { VehiclesListPage } from '../pages/vehicles-list.page';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Custom fixtures for vehicle tests
 */
type VehicleFixtures = {
  loginPage: LoginPage;
  vehiclesListPage: VehiclesListPage;
  vehicleDetailPage: VehicleDetailPage;
  vehicleFormPage: VehicleFormPage;
  authenticatedPage: Page;
  testImagePath: string;
  testVehicleData: ReturnType<typeof TestHelpers.generateVehicleData>;
};

export const test = base.extend<VehicleFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  vehiclesListPage: async ({ page }, use) => {
    const vehiclesListPage = new VehiclesListPage(page);
    await use(vehiclesListPage);
  },

  vehicleDetailPage: async ({ page }, use) => {
    const vehicleDetailPage = new VehicleDetailPage(page);
    await use(vehicleDetailPage);
  },

  vehicleFormPage: async ({ page }, use) => {
    const vehicleFormPage = new VehicleFormPage(page);
    await use(vehicleFormPage);
  },

  authenticatedPage: async ({ page }, use) => {
    // Login before each test using Keycloak flow
    const username = process.env.TEST_USERNAME || 'john.admin';
    const password = process.env.TEST_PASSWORD || 'a123456A!';

    await page.goto('/');
    
    // Check if already logged in
    const isLoggedIn = await page.locator('[href="/vehicles"], nav, header').first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!isLoggedIn) {
      // Perform Keycloak login
      const loginPage = new LoginPage(page);
      
      // Check if we're on the landing page with Keycloak button
      const hasKeycloakButton = await loginPage.signInWithKeycloakButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasKeycloakButton) {
        // Click "Sign in with Keycloak" button
        await loginPage.signInWithKeycloakButton.click();
        
        // Wait for Keycloak login page
        await page.waitForURL(url => url.toString().includes('/protocol/openid-connect/auth'), { timeout: 10000 });
        
        // Enter credentials on Keycloak page
        await loginPage.keycloakUsernameInput.fill(username);
        await loginPage.keycloakPasswordInput.fill(password);
        await loginPage.keycloakLoginButton.click();
        
        // Wait for redirect back to application
        await page.waitForURL(url => !url.toString().includes('/protocol/openid-connect/'), { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
      }
    }

    await use(page);
  },

  testImagePath: async ({}, use) => {
    // Create a test image file
    const fixturesDir = path.join(__dirname, '../fixtures');
    const imagePath = path.join(fixturesDir, 'test-image.png');

    // Create fixtures directory if it doesn't exist
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create a simple PNG image
    const imageBuffer = TestHelpers.createTestImageBuffer(100);
    fs.writeFileSync(imagePath, imageBuffer);

    await use(imagePath);

    // Cleanup
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  },

  testVehicleData: async ({}, use) => {
    const data = TestHelpers.generateVehicleData('Playwright');
    await use(data);
  },
});

export { expect };
