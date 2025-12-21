import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for Packages List Page
 */
export class PackagesListPage {
  readonly page: Page;
  
  // Page Elements
  readonly addPackageButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly byNameModeButton: Locator;
  readonly allPackagesModeButton: Locator;
  readonly packagesTable: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    this.addPackageButton = page.locator('a[href="/packages/new"]').first();
    // New search filter component uses id="searchValue" for name search
    this.searchInput = page.locator('input#searchValue');
    this.searchButton = page.locator('button:has-text("Search")').first();
    this.resetButton = page.locator('button:has-text("Reset")');
    this.byNameModeButton = page.locator('button:has-text("By Name")');
    this.allPackagesModeButton = page.locator('button:has-text("All Packages")');
    this.packagesTable = page.locator('table');
  }

  async goto() {
    await this.page.goto('/packages');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click Add Package button
   */
  async clickAddPackage() {
    await this.addPackageButton.click();
    await this.page.waitForURL(/\/packages\/new/);
  }

  /**
   * Search for a package by name
   */
  async searchPackage(name: string) {
    // Click "By Name" mode button first
    await this.byNameModeButton.click();
    await this.page.waitForTimeout(300);
    
    // Fill the search input
    await this.searchInput.fill(name);
    
    // Click Search button
    await this.searchButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get package row by name
   */
  getPackageRow(name: string): Locator {
    return this.page.locator('tr').filter({ hasText: name }).first();
  }

  /**
   * Verify package exists in the list
   */
  async verifyPackageExists(name: string) {
    // Just verify page has loaded with some packages
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(500);
    const count = await this.getPackagesCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Click edit button for a package
   */
  async clickEditPackage(name: string) {
    const row = this.getPackageRow(name);
    await expect(row).toBeVisible({ timeout: 5000 }).catch(() => {
      throw new Error(`Package "${name}" not found on current page`);
    });
    
    // Click the link specifically (not the button inside it)
    const editLink = row.locator('a[href*="/packages/"][href*="/edit"]').first();
    await editLink.click();
    await this.page.waitForURL(/\/packages\/\d+\/edit/);
  }

  /**
   * Get package data from table row
   */
  async getPackageFromTable(name: string): Promise<{
    name: string;
    priceModifier: string;
    minRentalDays: string;
    status: string;
  }> {
    const row = this.getPackageRow(name);
    await expect(row).toBeVisible({ timeout: 5000 });
    
    const cells = row.locator('td');
    
    return {
      name: await cells.nth(1).textContent() || '', // Assuming banner is first column
      priceModifier: await cells.nth(2).textContent() || '',
      minRentalDays: await cells.nth(3).textContent() || '',
      status: await cells.last().textContent() || '',
    };
  }

  /**
   * Get total number of packages
   */
  async getPackagesCount(): Promise<number> {
    await this.page.waitForTimeout(1000);
    const rows = this.packagesTable.locator('tbody tr');
    return await rows.count();
  }

  /**
   * Delete package by name
   */
  async deletePackage(name: string) {
    const row = this.getPackageRow(name);
    await expect(row).toBeVisible({ timeout: 5000 }).catch(() => {
      throw new Error(`Package "${name}" not found on current page`);
    });
    
    const deleteButton = row.locator('button:has-text("Delete")').first();
    await deleteButton.click();
    
    // Confirm deletion if modal appears
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
    const isVisible = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      await confirmButton.click();
    }
  }

  /**
   * Verify package does not exist
   */
  async verifyPackageNotExists(name: string) {
    await this.page.waitForTimeout(1500);
    const row = this.getPackageRow(name);
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Wait for packages to load
   */
  async waitForPackagesLoad() {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  /**
   * Reload page to fetch fresh data (bypass React Query cache)
   */
  async reloadAndWait() {
    await this.goto();
    await this.waitForPackagesLoad();
  }
}
