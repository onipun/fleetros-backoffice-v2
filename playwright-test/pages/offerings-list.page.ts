import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for Offerings List Page
 */
export class OfferingsListPage {
  readonly page: Page;
  
  // Navigation
  readonly addOfferingButton: Locator;
  
  // Search and Filters
  readonly searchInput: Locator;
  readonly typeFilter: Locator;
  readonly exportButton: Locator;
  
  // Pagination
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly pageInfo: Locator;
  
  // Table
  readonly offeringsTable: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation
    this.addOfferingButton = page.locator('a[href="/offerings/new"]').first();
    
    // Search and Filters
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    this.typeFilter = page.locator('select').first();
    this.exportButton = page.locator('button:has-text("Export")');
    
    // Pagination
    this.previousButton = page.locator('button:has-text("Previous")');
    this.nextButton = page.locator('button:has-text("Next")');
    this.pageInfo = page.locator('text=/Page \\d+ of \\d+/i');
    
    // Table
    this.offeringsTable = page.locator('table');
    this.noResultsMessage = page.locator('text=/no results|no offerings/i');
  }

  async goto() {
    await this.page.goto('/offerings');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click "Add Offering" button
   */
  async clickAddOffering() {
    await this.addOfferingButton.click();
  }

  /**
   * Search for offering by name
   */
  async searchOffering(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for debounce
  }

  /**
   * Filter by type
   */
  async filterByType(type: string) {
    await this.typeFilter.selectOption(type);
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify offering exists in list
   */
  async verifyOfferingExists(offeringName: string) {
    const offeringRow = this.page.locator(`tr:has-text("${offeringName}")`);
    await expect(offeringRow).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify offering does not exist in list
   */
  async verifyOfferingNotExists(offeringName: string) {
    const offeringRow = this.page.locator(`tr:has-text("${offeringName}")`);
    await expect(offeringRow).not.toBeVisible({ timeout: 3000 });
  }

  /**
   * Click view button for offering
   */
  async clickViewOffering(offeringName: string) {
    const row = this.page.locator(`tr:has-text("${offeringName}")`);
    const viewLink = row.locator('a:has-text("View")').first();
    await viewLink.click();
  }

  /**
   * Click edit button for offering
   */
  async clickEditOffering(offeringName: string) {
    const row = this.page.locator(`tr:has-text("${offeringName}")`);
    const editLink = row.locator('a:has-text("Edit")').first();
    await editLink.click();
  }

  /**
   * Delete offering
   */
  async deleteOffering(offeringName: string) {
    const row = this.page.locator(`tr:has-text("${offeringName}")`);
    const deleteButton = row.locator('button:has(svg)').last(); // Trash icon button
    
    // Set up dialog handler before clicking
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    
    await deleteButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get offering details from list row
   */
  async getOfferingDetails(offeringName: string) {
    const row = this.page.locator(`tr:has-text("${offeringName}")`);
    const cells = row.locator('td');
    
    return {
      name: await cells.nth(0).textContent(),
      type: await cells.nth(1).textContent(),
      price: await cells.nth(2).textContent(),
      availability: await cells.nth(3).textContent(),
      maxQuantity: await cells.nth(4).textContent(),
      mandatory: await cells.nth(5).textContent(),
      status: await cells.nth(6).textContent(),
    };
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.nextButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.previousButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify table has offerings
   */
  async verifyHasOfferings() {
    const rows = this.offeringsTable.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get total number of offerings in table
   */
  async getOfferingsCount(): Promise<number> {
    const rows = this.offeringsTable.locator('tbody tr');
    return await rows.count();
  }
}
