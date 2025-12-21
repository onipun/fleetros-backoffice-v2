import { Locator, Page, expect } from '@playwright/test';

export class PaymentsListPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly paymentsTab: Locator;
  readonly settlementsTab: Locator;
  readonly paymentsTable: Locator;
  readonly searchFilters: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1');
    this.paymentsTab = page.locator('[role="tab"]:has-text("Payments")');
    this.settlementsTab = page.locator('[role="tab"]:has-text("Settlements")');
    this.paymentsTable = page.locator('table');
    this.searchFilters = page.locator('[data-testid="payment-search-filters"], form').first();
    this.searchButton = page.locator('button:has-text("Search")');
    this.resetButton = page.locator('button:has-text("Reset")');
  }

  async goto() {
    await this.page.goto('/payments');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.pageTitle).toContainText(/Payment/i, { timeout: 10000 });
  }

  async clickPaymentsTab() {
    await this.paymentsTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickSettlementsTab() {
    await this.settlementsTab.click();
    await this.page.waitForTimeout(500);
  }

  async getPaymentRowCount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    return await rows.count();
  }

  async getFirstPaymentRow(): Promise<Locator> {
    return this.page.locator('table tbody tr').first();
  }

  async verifyTableHeaders() {
    const headers = this.page.locator('table thead th');
    const headerTexts = await headers.allTextContents();
    
    // Check for common payment table headers
    const expectedHeaders = ['ID', 'Amount', 'Method', 'Status'];
    for (const expected of expectedHeaders) {
      const found = headerTexts.some(h => h.toLowerCase().includes(expected.toLowerCase()));
      expect(found).toBeTruthy();
    }
  }

  async verifyPaymentInList(paymentId: string): Promise<boolean> {
    const row = this.page.locator(`table tbody tr:has-text("#${paymentId}")`);
    return await row.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickViewBooking(rowIndex: number = 0) {
    const row = this.page.locator('table tbody tr').nth(rowIndex);
    const viewButton = row.locator('button:has-text("View")');
    await viewButton.click();
  }

  async verifySettlementsTabContent() {
    await this.clickSettlementsTab();
    await this.page.waitForTimeout(1000);
    
    // Check for settlements content (OutstandingSettlementsDashboard)
    const settlementsContent = this.page.locator('[role="tabpanel"]');
    await expect(settlementsContent).toBeVisible({ timeout: 5000 });
  }

  async getPaymentMethodFromRow(rowIndex: number = 0): Promise<string> {
    const row = this.page.locator('table tbody tr').nth(rowIndex);
    const methodCell = row.locator('td').nth(2); // Method is usually 3rd column
    return await methodCell.textContent() || '';
  }

  async getPaymentStatusFromRow(rowIndex: number = 0): Promise<string> {
    const row = this.page.locator('table tbody tr').nth(rowIndex);
    const statusBadge = row.locator('span[class*="rounded"]');
    return await statusBadge.textContent() || '';
  }
}
