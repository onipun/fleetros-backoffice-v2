import { test as base, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { BookingDetailPage } from '../pages/booking-detail.page';
import { BookingFormPage } from '../pages/booking-form.page';
import { BookingsListPage } from '../pages/bookings-list.page';
import { DiscountFormPage } from '../pages/discount-form.page';
import { DiscountsListPage } from '../pages/discounts-list.page';
import { LoginPage } from '../pages/login.page';
import { LoyaltyConfigurationFormPage } from '../pages/loyalty-configuration-form.page';
import { LoyaltyConfigurationsListPage } from '../pages/loyalty-configurations-list.page';
import { ModificationPoliciesListPage } from '../pages/modification-policies-list.page';
import { ModificationPolicyFormPage } from '../pages/modification-policy-form.page';
import { OfferingDetailPage } from '../pages/offering-detail.page';
import { OfferingFormPage } from '../pages/offering-form.page';
import { OfferingsListPage } from '../pages/offerings-list.page';
import { PackageFormPage } from '../pages/package-form.page';
import { PackagesListPage } from '../pages/packages-list.page';
import { RegisterPage } from '../pages/register.page';
import { VehicleDetailPage } from '../pages/vehicle-detail.page';
import { VehicleFormPage } from '../pages/vehicle-form.page';
import { VehiclesListPage } from '../pages/vehicles-list.page';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Custom fixtures for vehicle tests
 */
type VehicleFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  vehiclesListPage: VehiclesListPage;
  vehicleDetailPage: VehicleDetailPage;
  vehicleFormPage: VehicleFormPage;
  discountFormPage: DiscountFormPage;
  discountsListPage: DiscountsListPage;
  offeringsListPage: OfferingsListPage;
  offeringFormPage: OfferingFormPage;
  offeringDetailPage: OfferingDetailPage;
  packagesListPage: PackagesListPage;
  packageFormPage: PackageFormPage;
  modificationPoliciesListPage: ModificationPoliciesListPage;
  modificationPolicyFormPage: ModificationPolicyFormPage;
  loyaltyConfigurationsListPage: LoyaltyConfigurationsListPage;
  loyaltyConfigurationFormPage: LoyaltyConfigurationFormPage;
  bookingsListPage: BookingsListPage;
  bookingFormPage: BookingFormPage;
  bookingDetailPage: BookingDetailPage;
  authenticatedPage: Page;
  testImagePath: string;
  testVehicleData: ReturnType<typeof TestHelpers.generateVehicleData>;
  testOfferingData: ReturnType<typeof TestHelpers.generateOfferingData>;
  testPackageData: ReturnType<typeof TestHelpers.generatePackageData>;
  testBookingData: ReturnType<typeof TestHelpers.generateBookingData>;
};

export const test = base.extend<VehicleFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
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

  discountFormPage: async ({ page }, use) => {
    const discountFormPage = new DiscountFormPage(page);
    await use(discountFormPage);
  },

  discountsListPage: async ({ page }, use) => {
    const discountsListPage = new DiscountsListPage(page);
    await use(discountsListPage);
  },

  offeringsListPage: async ({ page }, use) => {
    const offeringsListPage = new OfferingsListPage(page);
    await use(offeringsListPage);
  },

  offeringFormPage: async ({ page }, use) => {
    const offeringFormPage = new OfferingFormPage(page);
    await use(offeringFormPage);
  },

  offeringDetailPage: async ({ page }, use) => {
    const offeringDetailPage = new OfferingDetailPage(page);
    await use(offeringDetailPage);
  },

  packagesListPage: async ({ page }, use) => {
    const packagesListPage = new PackagesListPage(page);
    await use(packagesListPage);
  },

  packageFormPage: async ({ page }, use) => {
    const packageFormPage = new PackageFormPage(page);
    await use(packageFormPage);
  },

  modificationPoliciesListPage: async ({ page }, use) => {
    const modificationPoliciesListPage = new ModificationPoliciesListPage(page);
    await use(modificationPoliciesListPage);
  },

  modificationPolicyFormPage: async ({ page }, use) => {
    const modificationPolicyFormPage = new ModificationPolicyFormPage(page);
    await use(modificationPolicyFormPage);
  },

  loyaltyConfigurationsListPage: async ({ page }, use) => {
    const loyaltyConfigurationsListPage = new LoyaltyConfigurationsListPage(page);
    await use(loyaltyConfigurationsListPage);
  },

  loyaltyConfigurationFormPage: async ({ page }, use) => {
    const loyaltyConfigurationFormPage = new LoyaltyConfigurationFormPage(page);
    await use(loyaltyConfigurationFormPage);
  },

  bookingsListPage: async ({ page }, use) => {
    const bookingsListPage = new BookingsListPage(page);
    await use(bookingsListPage);
  },

  bookingFormPage: async ({ page }, use) => {
    const bookingFormPage = new BookingFormPage(page);
    await use(bookingFormPage);
  },

  bookingDetailPage: async ({ page }, use) => {
    const bookingDetailPage = new BookingDetailPage(page);
    await use(bookingDetailPage);
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

  testOfferingData: async ({}, use) => {
    const data = TestHelpers.generateOfferingData('Playwright');
    await use(data);
  },

  testPackageData: async ({}, use) => {
    const data = TestHelpers.generatePackageData('Playwright');
    await use(data);
  },

  testBookingData: async ({}, use) => {
    const data = TestHelpers.generateBookingData('Playwright');
    await use(data);
  },
});

export { expect };
