import { Locator, Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class DiscountsListPage {
  readonly page: Page;
  readonly addDiscountButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly applyFiltersButton: Locator;
  readonly clearFiltersButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addDiscountButton = page.locator('a[href="/discounts/new"]');
    this.searchInput = page.locator('input[name="q"]');
    this.statusFilter = page.locator('select[name="status"]');
    this.applyFiltersButton = page.locator('button:has-text("Apply Filters")');
    this.clearFiltersButton = page.locator('a:has-text("Clear")');
    this.emptyState = page.locator('text=No discounts found');
  }

  async goto() {
    await this.page.goto('/discounts');
    await this.page.waitForLoadState('networkidle');
  }

  async clickAddDiscount() {
    await this.addDiscountButton.click();
    await this.page.waitForURL('**/discounts/new');
  }

  async searchDiscount(code: string) {
    await this.searchInput.fill(code);
    await this.applyFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
    await TestHelpers.delay(500);
  }

  async verifyDiscountExists(code: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  async verifyDiscountNotExists(code: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  async clickEditDiscount(code: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    const editButton = row.locator('a:has-text("Edit")'); // Assuming Edit is a link or button
    await editButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async deleteDiscount(code: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    // Use aria-label as defined in DeleteDiscountButton component
    const deleteButton = row.locator('button[aria-label="Delete discount"]');
    
    // Setup dialog handler to accept the confirmation
    this.page.once('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });
    
    await deleteButton.click();
    
    // Wait for deletion to complete
    await this.page.waitForLoadState('networkidle');
    await TestHelpers.delay(1000);
  }
}
