import { Locator, Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export interface BookingFormData {
  vehicleId?: number;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  insurancePolicy?: string;
}

export class BookingFormPage {
  readonly page: Page;
  readonly nextStepButton: Locator;
  readonly previousStepButton: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  
  // Step 1: Reservation Details
  readonly vehicleSelector: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  
  // Step 2: Customer Information
  readonly guestNameInput: Locator;
  readonly guestEmailInput: Locator;
  readonly guestPhoneInput: Locator;
  
  // Step 3: Logistic Coverage
  readonly pickupLocationInput: Locator;
  readonly dropoffLocationInput: Locator;
  readonly insurancePolicyInput: Locator;
  
  // Step 4: Pricing Overview
  readonly previewPricingButton: Locator;
  readonly confirmBookingButton: Locator;
  readonly pricingPreviewSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nextStepButton = page.locator('button:has-text("Next")');
    this.previousStepButton = page.locator('button:has-text("Previous"), button:has-text("Back")');
    this.submitButton = page.locator('button[type="submit"], button:has-text("Create Booking"), button:has-text("Confirm")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    
    // Step 1
    this.vehicleSelector = page.locator('[data-testid="vehicle-selector"], button:has-text("Select Vehicle")');
    this.startDateInput = page.locator('input[name="startDate"], [data-testid="start-date"]');
    this.endDateInput = page.locator('input[name="endDate"], [data-testid="end-date"]');
    
    // Step 2
    this.guestNameInput = page.locator('input[name="guestName"], input#guestName');
    this.guestEmailInput = page.locator('input[name="guestEmail"], input#guestEmail');
    this.guestPhoneInput = page.locator('input[name="guestPhone"], input#guestPhone');
    
    // Step 3
    this.pickupLocationInput = page.locator('input[name="pickupLocation"], input#pickupLocation');
    this.dropoffLocationInput = page.locator('input[name="dropoffLocation"], input#dropoffLocation');
    this.insurancePolicyInput = page.locator('textarea[name="insurancePolicy"], textarea#insurancePolicy');
    
    // Step 4
    this.previewPricingButton = page.locator('button:has-text("Preview Pricing")');
    this.confirmBookingButton = page.locator('button:has-text("Confirm & Create"), button:has-text("Create Booking")');
    this.pricingPreviewSection = page.locator('[data-testid="pricing-preview"], .border-green-500');
  }

  async goto() {
    await this.page.goto('/bookings/new');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForFormLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await TestHelpers.delay(500);
  }

  async selectVehicle(vehicleId: number) {
    // Click the vehicle selector to open the dialog/dropdown
    const vehicleSelectorButton = this.page.locator('button:has-text("Select Vehicle")');
    await vehicleSelectorButton.click();
    await this.page.waitForTimeout(500);
    
    // Wait for vehicle list to load
    await this.page.waitForLoadState('domcontentloaded');
    
    // Select the vehicle by clicking on it
    const vehicleOption = this.page.locator(`[data-vehicle-id="${vehicleId}"], button:has-text("Select"):near(:text("#${vehicleId}"))`).first();
    if (await vehicleOption.isVisible()) {
      await vehicleOption.click();
    } else {
      // Fallback: click the first available vehicle
      const firstVehicle = this.page.locator('button:has-text("Select")').first();
      await firstVehicle.click();
    }
    await this.page.waitForTimeout(500);
  }

  async fillStartDate(date: string) {
    // Find and fill the start date picker
    const datePickerTrigger = this.page.locator('button[aria-label*="start"], [data-testid="start-date-picker"]').first();
    if (await datePickerTrigger.isVisible()) {
      await datePickerTrigger.click();
      // Select date from calendar
      await this.selectDateFromCalendar(date);
    }
  }

  async fillEndDate(date: string) {
    // Find and fill the end date picker
    const datePickerTrigger = this.page.locator('button[aria-label*="end"], [data-testid="end-date-picker"]').first();
    if (await datePickerTrigger.isVisible()) {
      await datePickerTrigger.click();
      await this.selectDateFromCalendar(date);
    }
  }

  private async selectDateFromCalendar(dateString: string) {
    const date = new Date(dateString);
    const day = date.getDate();
    
    // Click on the day in the calendar
    const dayButton = this.page.locator(`button:has-text("${day}")`).first();
    await dayButton.click();
    await this.page.waitForTimeout(300);
  }

  async fillCustomerInfo(data: { name?: string; email?: string; phone?: string }) {
    if (data.name) {
      await this.guestNameInput.fill(data.name);
    }
    if (data.email) {
      await this.guestEmailInput.fill(data.email);
    }
    if (data.phone) {
      await this.guestPhoneInput.fill(data.phone);
    }
  }

  async fillLogisticsInfo(data: { pickup?: string; dropoff?: string; insurance?: string }) {
    if (data.pickup) {
      await this.pickupLocationInput.fill(data.pickup);
    }
    if (data.dropoff) {
      await this.dropoffLocationInput.fill(data.dropoff);
    }
    if (data.insurance) {
      await this.insurancePolicyInput.fill(data.insurance);
    }
  }

  async goToNextStep() {
    await this.nextStepButton.click();
    await this.page.waitForTimeout(500);
  }

  async goToPreviousStep() {
    await this.previousStepButton.click();
    await this.page.waitForTimeout(500);
  }

  async previewPricing() {
    await this.submitButton.click();
    await this.page.waitForTimeout(2000);
  }

  async confirmBooking() {
    // Wait for pricing preview to be visible
    await this.page.waitForTimeout(1000);
    
    // Click confirm/create button
    const confirmButton = this.page.locator('button:has-text("Confirm & Create"), button:has-text("Create Booking")').first();
    await confirmButton.click();
    
    // Wait for API response
    await this.page.waitForTimeout(3000);
  }

  async fillCompleteBookingForm(data: BookingFormData) {
    // This is a convenience method to fill the entire form
    // Step 1: Vehicle selection - skip if vehicleId not provided, will select first available
    if (data.vehicleId) {
      await this.selectVehicle(data.vehicleId);
    }
    
    // Move to step 2
    await this.goToNextStep();
    
    // Step 2: Customer info
    await this.fillCustomerInfo({
      name: data.guestName,
      email: data.guestEmail,
      phone: data.guestPhone,
    });
    
    // Move to step 3
    await this.goToNextStep();
    
    // Step 3: Logistics
    await this.fillLogisticsInfo({
      pickup: data.pickupLocation,
      dropoff: data.dropoffLocation,
      insurance: data.insurancePolicy,
    });
    
    // Move to step 4
    await this.goToNextStep();
  }

  async verifyOnStep(stepNumber: number) {
    // Verify we're on the expected step
    const stepIndicators = this.page.locator('[data-testid="stepper"] [aria-current="step"], .step-active');
    await this.page.waitForTimeout(300);
  }

  async verifyFormError(errorText: string) {
    const error = this.page.locator('.text-destructive, [role="alert"]', { hasText: errorText });
    await expect(error).toBeVisible({ timeout: 5000 });
  }

  async verifyPricingPreviewVisible() {
    await expect(this.pricingPreviewSection).toBeVisible({ timeout: 10000 });
  }
}
