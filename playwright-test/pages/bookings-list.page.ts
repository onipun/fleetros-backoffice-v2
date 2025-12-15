import { Locator, Page, expect } from '@playwright/test';

export class BookingsListPage {
  readonly page: Page;
  readonly newBookingButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly allBookingsModeButton: Locator;
  readonly byIdModeButton: Locator;
  readonly byCustomerModeButton: Locator;
  readonly byStatusModeButton: Locator;
  readonly emptyState: Locator;
  readonly bookingsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use first() to handle both header button and empty state button
    this.newBookingButton = page.locator('a[href="/bookings/new"]').first();
    this.searchInput = page.locator('input#bookingId, input#emailOrPhone');
    this.searchButton = page.locator('button:has(svg.lucide-search):has-text("Search")');
    this.resetButton = page.locator('button:has-text("Reset")');
    this.allBookingsModeButton = page.locator('button[aria-label="All Bookings"]');
    this.byIdModeButton = page.locator('button[aria-label="By ID"]');
    this.byCustomerModeButton = page.locator('button[aria-label="By Customer"]');
    this.byStatusModeButton = page.locator('button[aria-label="By Status"]');
    this.emptyState = page.locator('text=No bookings found');
    this.bookingsTable = page.locator('table');
  }

  async goto() {
    await this.page.goto('/bookings');
    await this.page.waitForLoadState('networkidle');
  }

  async clickNewBooking() {
    await this.newBookingButton.click();
    await this.page.waitForURL('**/bookings/new');
  }

  async searchById(bookingId: string) {
    // Click "By ID" mode button first
    await this.byIdModeButton.click();
    await this.page.waitForTimeout(500);
    
    // Fill the ID input
    const idInput = this.page.locator('input#bookingId');
    await idInput.click();
    await idInput.fill('');
    await idInput.fill(bookingId);
    await this.page.waitForTimeout(500);
    
    // Click Search button
    await this.searchButton.click();
    await this.page.waitForTimeout(1500);
  }

  async searchByCustomer(emailOrPhone: string) {
    // Click "By Customer" mode button
    await this.byCustomerModeButton.click();
    await this.page.waitForTimeout(500);
    
    // Fill the email/phone input
    const customerInput = this.page.locator('input#emailOrPhone');
    await customerInput.click();
    await customerInput.fill('');
    await customerInput.fill(emailOrPhone);
    await this.page.waitForTimeout(500);
    
    // Click Search button
    await this.searchButton.click();
    await this.page.waitForTimeout(1500);
  }

  async verifyBookingExists(bookingId: string) {
    await this.page.waitForLoadState('networkidle');
    const row = this.page.locator(`tr:has-text("#${bookingId}")`);
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  async verifyBookingNotExists(bookingId: string) {
    const row = this.page.locator(`tr:has-text("#${bookingId}")`);
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  async clickViewBooking(bookingId: string) {
    const row = this.page.locator(`tr:has-text("#${bookingId}")`);
    const viewButton = row.locator('a:has-text("View")');
    await viewButton.click({ timeout: 5000 });
    await this.page.waitForURL(`**/bookings/${bookingId}`);
  }

  async getBookingStatus(bookingId: string): Promise<string> {
    const row = this.page.locator(`tr:has-text("#${bookingId}")`);
    const statusBadge = row.locator('[class*="rounded-md"][class*="text-xs"]');
    return await statusBadge.textContent() || '';
  }

  async getBookingCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle');
    const rows = this.page.locator('table tbody tr');
    return await rows.count();
  }

  async resetSearch() {
    await this.resetButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getAllBookings() {
    await this.allBookingsModeButton.click();
    await this.page.waitForTimeout(500);
    await this.searchButton.click();
    await this.page.waitForTimeout(1500);
  }
}
