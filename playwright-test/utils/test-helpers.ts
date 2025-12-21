import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for vehicle CRUD operations
 */

export interface AuthSession {
  accessToken: string;
  username: string;
  userId: number;
}

export class TestHelpers {
  /**
   * Generate unique test data with timestamp
   */
  static generateUniqueId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate unique vehicle data
   */
  static generateVehicleData(prefix = 'Test') {
    const uniqueId = this.generateUniqueId();
    return {
      name: `${prefix} Vehicle ${uniqueId}`,
      licensePlate: `TST-${Math.floor(Math.random() * 9999)}`,
      vin: `VIN${uniqueId.toUpperCase()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      make: 'Toyota',
      model: 'Camry',
      year: new Date().getFullYear(),
      odometer: Math.floor(Math.random() * 50000),
      fuelType: 'Gasoline',
      transmissionType: 'Automatic',
      carType: 'SEDAN',
      seaterCount: 5,
      status: 'AVAILABLE' as const,
      bufferMinutes: 30,
      minRentalHours: 24,
      maxRentalDays: 30,
      maxFutureBookingDays: 90,
      details: `Test vehicle created at ${new Date().toISOString()}`,
    };
  }

  /**
   * Generate unique registration data
   */
  static generateRegistrationData(prefix = 'Test') {
    const uniqueId = this.generateUniqueId();
    const timestamp = Date.now();
    return {
      accountName: `${prefix} Account ${uniqueId}`,
      accountDescription: `Test account created at ${new Date().toISOString()}`,
      companyName: `${prefix} Company ${uniqueId}`,
      country: 'MY', // Malaysia
      firstName: `First${timestamp}`,
      lastName: `Last${timestamp}`,
      phoneNumber: `+60${Math.floor(100000000 + Math.random() * 900000000)}`,
      username: `user_${uniqueId}`,
      email: `test_${uniqueId}@example.com`,
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
    };
  }

  /**
   * Generate invalid registration data for edge case testing
   */
  static generateInvalidRegistrationData() {
    return {
      weakPassword: 'weak',
      noUppercase: 'password123!',
      noLowercase: 'PASSWORD123!',
      noDigit: 'Password!',
      noSpecialChar: 'Password123',
      shortPassword: 'Pa1!',
      mismatchPassword: 'Test@1234',
      mismatchConfirm: 'Different@1234',
      invalidEmail: 'notanemail',
      emptyEmail: '',
      invalidPhoneShort: '+601234',
      invalidPhoneLetters: '+60abc123456',
    };
  }

  /**
   * Generate unique offering data
   */
  static generateOfferingData(prefix = 'Test') {
    const uniqueId = this.generateUniqueId();
    return {
      name: `${prefix} Offering ${uniqueId}`,
      offeringType: 'GPS' as const,
      availability: 100,
      price: 50.00,
      maxQuantityPerBooking: 1,
      isMandatory: false,
      description: `Test offering created at ${new Date().toISOString()}`,
      // New inventory management fields with defaults
      inventoryMode: 'SHARED' as const,
      consumableType: 'RETURNABLE' as const,
      purchaseLimitPerBooking: null as number | null,
    };
  }

  /**
   * Generate offering data with minimum values
   */
  static generateMinimumOfferingData(prefix = 'Min') {
    const uniqueId = this.generateUniqueId();
    return {
      name: `${prefix} ${uniqueId}`,
      offeringType: 'OTHER' as const,
      availability: 0,
      price: 0.01,
      maxQuantityPerBooking: 1,
      isMandatory: false,
      description: '',
      inventoryMode: 'SHARED' as const,
      consumableType: 'RETURNABLE' as const,
      purchaseLimitPerBooking: null as number | null,
    };
  }

  /**
   * Generate offering data with maximum values
   */
  static generateMaximumOfferingData(prefix = 'Max') {
    const uniqueId = this.generateUniqueId();
    const maxName = `${prefix} ${'A'.repeat(245)} ${uniqueId}`.substring(0, 255);
    const maxDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
    
    return {
      name: maxName,
      offeringType: 'ADDITIONAL_DRIVER' as const,
      availability: 999999,
      price: 999999.99,
      maxQuantityPerBooking: 100,
      isMandatory: true,
      description: maxDescription,
      inventoryMode: 'SHARED' as const,
      consumableType: 'SERVICE' as const,
      purchaseLimitPerBooking: null as number | null,
    };
  }

  /**
   * Generate EXCLUSIVE offering data (e.g., villa, homestay)
   */
  static generateExclusiveOfferingData(prefix = 'Exclusive') {
    const uniqueId = this.generateUniqueId();
    return {
      name: `${prefix} Accommodation ${uniqueId}`,
      offeringType: 'OTHER' as const,
      availability: 1, // Will be auto-set by form for EXCLUSIVE
      price: 250.00,
      maxQuantityPerBooking: 1, // Will be auto-set by form for EXCLUSIVE
      isMandatory: false,
      description: `Exclusive accommodation offering created at ${new Date().toISOString()}`,
      inventoryMode: 'EXCLUSIVE' as const,
      consumableType: 'ACCOMMODATION' as const,
      purchaseLimitPerBooking: 1,
    };
  }

  /**
   * Generate CONSUMABLE offering data (e.g., full tank option)
   */
  static generateConsumableOfferingData(prefix = 'Consumable') {
    const uniqueId = this.generateUniqueId();
    return {
      name: `${prefix} Full Tank ${uniqueId}`,
      offeringType: 'OTHER' as const,
      availability: 100,
      price: 75.00,
      maxQuantityPerBooking: 1,
      isMandatory: false,
      description: `Consumable offering created at ${new Date().toISOString()}`,
      inventoryMode: 'SHARED' as const,
      consumableType: 'CONSUMABLE' as const,
      purchaseLimitPerBooking: 1,
    };
  }

  /**
   * Get all offering types for testing
   */
  static getAllOfferingTypes() {
    return ['GPS', 'INSURANCE', 'CHILD_SEAT', 'WIFI', 'ADDITIONAL_DRIVER', 'HOMESTAY', 'VILLA', 'CHAUFFEUR', 'AIRPORT_PICKUP', 'FULL_TANK', 'TOLL_PASS', 'OTHER'];
  }

  /**
   * Generate unique package data
   * Using '000' prefix to ensure it sorts first alphabetically on the list page
   */
  static generatePackageData(prefix = '000-Test') {
    const uniqueId = this.generateUniqueId();
    
    return {
      name: `${prefix} Package ${uniqueId}`,
      description: `Test package created at ${new Date().toISOString()}`,
      priceModifier: 100.00,
      modifierType: 'FIXED' as const,
      allowDiscountOnModifier: true,
      validFrom: 'Today', // Use quick select option
      validTo: 'End of Month', // Use quick select option
      minRentalDays: 2,
    };
  }

  /**
   * Generate unique booking data
   */
  static generateBookingData(prefix = 'Test') {
    const uniqueId = this.generateUniqueId();
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + 1); // Tomorrow
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3); // 3 days rental

    return {
      guestName: `${prefix} Guest ${uniqueId}`,
      guestEmail: `guest_${uniqueId}@example.com`,
      guestPhone: `+60${Math.floor(100000000 + Math.random() * 900000000)}`,
      pickupLocation: 'Kuala Lumpur Airport',
      dropoffLocation: 'Kuala Lumpur Airport',
      insurancePolicy: 'Standard coverage for test booking',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  /**  /**
   * Generate package data with minimum values
   */
  static generateMinimumPackageData(prefix = 'AAA-Min') {
    const uniqueId = this.generateUniqueId();
    
    return {
      name: `${prefix} ${uniqueId}`,
      description: '',
      priceModifier: 0,
      modifierType: 'FIXED' as const,
      allowDiscountOnModifier: false,
      validFrom: 'Today',
      validTo: 'End of Month',
      minRentalDays: 1,
    };
  }

  /**
   * Generate package data with maximum/large values
   */
  static generateMaximumPackageData(prefix = 'AAA-Max') {
    const uniqueId = this.generateUniqueId();
    const maxName = `${prefix} ${'A'.repeat(245)} ${uniqueId}`.substring(0, 255);
    const maxDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
    
    return {
      name: maxName,
      description: maxDescription,
      priceModifier: 999999.99,
      modifierType: 'PERCENTAGE' as const,
      allowDiscountOnModifier: true,
      validFrom: 'Start of Month',
      validTo: 'End of Year',
      minRentalDays: 365,
    };
  }

  /**
   * Generate package data with negative price modifier
   */
  static generateDiscountPackageData(prefix = 'AAA-Discount') {
    const uniqueId = this.generateUniqueId();
    
    return {
      name: `${prefix} Package ${uniqueId}`,
      description: 'Package with negative price modifier (discount)',
      priceModifier: -50.00,
      modifierType: 'FIXED' as const,
      allowDiscountOnModifier: false,
      validFrom: 'Today',
      validTo: 'End of Month',
      minRentalDays: 3,
    };
  }

  /**
   * Generate package data with percentage modifier
   */
  static generatePercentagePackageData(prefix = 'AAA-Percent') {
    const uniqueId = this.generateUniqueId();
    
    return {
      name: `${prefix} Package ${uniqueId}`,
      description: 'Package with percentage price modifier',
      priceModifier: 15.00,
      modifierType: 'PERCENTAGE' as const,
      allowDiscountOnModifier: true,
      validFrom: 'Today',
      validTo: 'End of Year',
      minRentalDays: 5,
    };
  }

  /**
   * Wait for toast notification
   */
  static async waitForToast(page: Page, text: string, timeout = 5000) {
    await page.waitForSelector(`[role="status"]:has-text("${text}")`, { timeout });
  }

  /**
   * Wait for API response
   */
  static async waitForAPIResponse(page: Page, urlPattern: string | RegExp) {
    return page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout: 10000 }
    );
  }

  /**
   * Get access token from session
   */
  static async getAccessToken(page: Page): Promise<string> {
    const response = await page.request.get('/api/auth/session');
    const session = await response.json();
    return session.accessToken;
  }

  /**
   * Wait for navigation and loading state
   */
  static async waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
  }

  /**
   * Take screenshot with custom name
   */
  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `./screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Check if element exists
   */
  static async elementExists(page: Page, selector: string): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fill form field safely
   */
  static async fillField(page: Page, selector: string, value: string | number) {
    await page.locator(selector).clear();
    await page.locator(selector).fill(String(value));
  }

  /**
   * Select dropdown option
   */
  static async selectOption(page: Page, selector: string, value: string) {
    await page.locator(selector).click();
    await page.locator(`[role="option"]:has-text("${value}")`).click();
  }

  /**
   * Wait for element to be visible
   */
  static async waitForVisible(page: Page, selector: string, timeout = 10000) {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Verify toast notification appears
   */
  static async verifyToastMessage(page: Page, expectedText: string | RegExp) {
    // Try multiple toast selectors - sonner uses different structures
    const toastSelectors = [
      '[role="status"]',
      '[data-sonner-toast]',
      '[data-type="success"]',
      '.sonner-toast',
      '[data-sonner-toaster] li',
    ];
    
    let found = false;
    for (const selector of toastSelectors) {
      try {
        if (typeof expectedText === 'string') {
          const toast = page.locator(selector, { hasText: expectedText });
          const isVisible = await toast.isVisible().catch(() => false);
          if (isVisible) {
            found = true;
            break;
          }
        } else {
          const toast = page.locator(selector).filter({ hasText: expectedText });
          const isVisible = await toast.isVisible().catch(() => false);
          if (isVisible) {
            found = true;
            break;
          }
        }
      } catch {
        continue;
      }
    }
    
    if (!found) {
      // Wait for any toast-like element with the expected text
      const fallbackToast = page.getByText(expectedText).first();
      await expect(fallbackToast).toBeVisible({ timeout: 15000 });
    }
  }

  /**
   * Verify error message
   */
  static async verifyErrorMessage(page: Page, expectedText: string) {
    const error = page.locator('.text-destructive, [role="alert"]', { hasText: expectedText });
    await expect(error).toBeVisible({ timeout: 5000 });
  }

  /**
   * Create test image file
   */
  static createTestImageBuffer(sizeInKB: number = 100): Buffer {
    // Create a simple PNG header + data
    const header = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width
      0x00, 0x00, 0x00, 0x01, // height
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
    ]);
    
    const dataSize = sizeInKB * 1024 - header.length;
    const data = Buffer.alloc(dataSize, 0);
    return Buffer.concat([header, data]);
  }

  /**
   * Clean up test data
   */
  static async cleanupTestVehicles(page: Page, testPrefix: string) {
    try {
      const token = await this.getAccessToken(page);
      const response = await page.request.get('/api/vehicles', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok()) {
        const data = await response.json();
        const vehicles = data._embedded?.vehicles || data;

        for (const vehicle of vehicles) {
          if (vehicle.name?.includes(testPrefix)) {
            const vehicleId = vehicle.id;
            await page.request.delete(`/api/vehicles/${vehicleId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
    } catch (error) {
      console.log('Cleanup failed:', error);
    }
  }

  /**
   * Format date for input fields
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Add delay
   */
  static async delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry operation
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await this.delay(delayMs);
      }
    }
    throw new Error('Retry failed');
  }
}
