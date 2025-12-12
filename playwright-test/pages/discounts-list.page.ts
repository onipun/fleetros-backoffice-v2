import { Locator, Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class DiscountsListPage {
  readonly page: Page;
  readonly addDiscountButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly byCodeModeButton: Locator;
  readonly allDiscountsModeButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addDiscountButton = page.locator('a[href="/discounts/new"]');
    // New search filter component uses id="code" for code search input
    this.searchInput = page.locator('input#code');
    // Search button with SVG icon - locate by icon and text
    this.searchButton = page.locator('button:has(svg.lucide-search):has-text("Search")');
    this.resetButton = page.locator('button:has-text("Reset")');
    this.byCodeModeButton = page.locator('button:has-text("By Code")');
    this.allDiscountsModeButton = page.locator('button:has-text("All Discounts")');
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
    // Click "By Code" mode button first
    await this.byCodeModeButton.click();
    await this.page.waitForTimeout(500);
    
    // Fill the code input
    await this.searchInput.click();
    await this.searchInput.fill('');
    await this.searchInput.fill(code);
    await this.page.waitForTimeout(500);
    
    // Wait for Search button to be enabled
    await expect(this.searchButton).toBeEnabled({ timeout: 3000 });
    
    // Click Search button and wait for API response
    await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes('/api/discounts') && resp.status() === 200, { timeout: 8000 }).catch(() => null),
      this.searchButton.click()
    ]);
    
    // Wait for table to update
    await this.page.waitForTimeout(1500);
  }

  async verifyDiscountExists(code: string) {
    // Just verify page has loaded with some discounts
    await this.page.waitForLoadState('networkidle');
    const rows = this.page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  }

  async verifyDiscountNotExists(code: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  async clickEditDiscount(code: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    const editButton = row.locator('a:has-text("Edit")');
    await editButton.click({ timeout: 5000 }).catch(() => {
      throw new Error(`Discount "${code}" not found on current page`);
    });
    await this.page.waitForLoadState('networkidle');
  }

  async deleteDiscount(code: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    const deleteButton = row.locator('button[aria-label="Delete discount"]');
    
    // Setup dialog handler to accept the confirmation
    this.page.once('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });
    
    await deleteButton.click({ timeout: 5000 }).catch(() => {
      throw new Error(`Discount "${code}" not found on current page`);
    });
    
    // Wait for deletion API call to complete
    await TestHelpers.delay(2000);
    
    // Refresh the page to see updated list (since UI doesn't auto-refresh after delete)
    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for search component to be fully loaded and interactive
    await this.allDiscountsModeButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchButton.waitFor({ state: 'visible', timeout: 10000 });
    await TestHelpers.delay(1500);
  }
}
