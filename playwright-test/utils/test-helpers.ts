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
    if (typeof expectedText === 'string') {
      const toast = page.locator('[role="status"]', { hasText: expectedText });
      await expect(toast).toBeVisible({ timeout: 5000 });
    } else {
      const toast = page.locator('[role="status"]').filter({ hasText: expectedText });
      await expect(toast).toBeVisible({ timeout: 5000 });
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
