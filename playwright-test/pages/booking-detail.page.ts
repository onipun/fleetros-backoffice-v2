import { Locator, Page, expect } from '@playwright/test';

export class BookingDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly editButton: Locator;
  readonly recordPaymentButton: Locator;
  readonly printReceiptButton: Locator;
  readonly modifyBookingButton: Locator;
  readonly markAsCompletedButton: Locator;
  
  // Tab navigation
  readonly detailsTab: Locator;
  readonly paymentsTab: Locator;
  readonly historyTab: Locator;
  
  // Booking info
  readonly bookingTitle: Locator;
  readonly statusBadge: Locator;
  readonly vehicleInfo: Locator;
  readonly customerInfo: Locator;
  readonly dateInfo: Locator;
  readonly priceInfo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.locator('a:has-text("Back")');
    this.editButton = page.locator('a:has-text("Edit"), button:has-text("Modify Booking")');
    this.recordPaymentButton = page.locator('button:has-text("Record Payment")');
    this.printReceiptButton = page.locator('button:has-text("Print"), button:has-text("Receipt")');
    this.modifyBookingButton = page.locator('button:has-text("Modify Booking")');
    this.markAsCompletedButton = page.locator('button:has-text("Mark as Completed")');
    
    // Tabs
    this.detailsTab = page.locator('[role="tab"]:has-text("Details")');
    this.paymentsTab = page.locator('[role="tab"]:has-text("Payments")');
    this.historyTab = page.locator('[role="tab"]:has-text("History")');
    
    // Info sections
    this.bookingTitle = page.locator('h1');
    this.statusBadge = page.locator('[class*="rounded-md"][class*="text-xs"]').first();
    this.vehicleInfo = page.locator('text=Vehicle').locator('..').locator('p.font-medium');
    this.customerInfo = page.locator('text=Guest Name').locator('..');
    this.dateInfo = page.locator('text=Start').locator('..');
    this.priceInfo = page.locator('text=Final Price').locator('..');
  }

  async goto(bookingId: string) {
    await this.page.goto(`/bookings/${bookingId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await expect(this.bookingTitle).toBeVisible({ timeout: 10000 });
  }

  async verifyBookingId(bookingId: string) {
    await expect(this.bookingTitle).toContainText(`#${bookingId}`);
  }

  async getBookingStatus(): Promise<string> {
    const statusElement = this.page.locator('p.font-medium').filter({ hasText: /PENDING|CONFIRMED|COMPLETED|CANCELLED/ });
    return await statusElement.textContent() || '';
  }

  async clickDetailsTab() {
    await this.detailsTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickPaymentsTab() {
    await this.paymentsTab.click();
    await this.page.waitForTimeout(500);
  }

  async clickHistoryTab() {
    await this.historyTab.click();
    await this.page.waitForTimeout(500);
  }

  async markAsCompleted() {
    // Accept the confirmation dialog
    this.page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    await this.markAsCompletedButton.click();
    await this.page.waitForTimeout(2000);
  }

  async verifyStatusIs(status: string) {
    const statusText = await this.getBookingStatus();
    expect(statusText.toUpperCase()).toContain(status.toUpperCase());
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL('**/bookings');
  }

  async openModifyDialog() {
    await this.modifyBookingButton.click();
    await this.page.waitForTimeout(500);
  }

  async openRecordPaymentDialog() {
    await this.recordPaymentButton.click();
    await this.page.waitForTimeout(500);
  }

  async verifyCustomerName(name: string) {
    const guestNameField = this.page.locator('text=Guest Name').locator('..').locator('p.font-medium, p:not(.text-muted-foreground)');
    await expect(guestNameField.first()).toContainText(name, { timeout: 5000 });
  }

  async verifyPickupLocation(location: string) {
    const pickupField = this.page.locator('text=Pickup Location').locator('..').locator('p.font-medium');
    await expect(pickupField.first()).toContainText(location, { timeout: 5000 });
  }

  async verifyHistoryEntry(entryText: string) {
    await this.clickHistoryTab();
    await this.page.waitForTimeout(1000);
    const historyEntry = this.page.locator(`text=${entryText}`);
    await expect(historyEntry).toBeVisible({ timeout: 10000 });
  }
}
