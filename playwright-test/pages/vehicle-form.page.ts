import { Locator, Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Page Object Model for Vehicle Create/Edit Page
 */
export class VehicleFormPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly licensePlateInput: Locator;
  readonly statusSelect: Locator;
  readonly makeInput: Locator;
  readonly modelInput: Locator;
  readonly yearInput: Locator;
  readonly vinInput: Locator;
  readonly odometerInput: Locator;
  readonly fuelTypeSelect: Locator;
  readonly transmissionSelect: Locator;
  readonly carTypeSelect: Locator;
  readonly seaterCountInput: Locator;
  readonly bufferMinutesInput: Locator;
  readonly minRentalHoursInput: Locator;
  readonly maxRentalDaysInput: Locator;
  readonly maxFutureBookingDaysInput: Locator;
  readonly detailsTextarea: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly submitButton: Locator;
  readonly saveDraftButton: Locator;
  readonly stepIndicators: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('input[name="name"]');
    this.licensePlateInput = page.locator('input[name="licensePlate"]');
    this.statusSelect = page.locator('select[name="status"], [name="status"]');
    this.makeInput = page.locator('input[name="make"]');
    this.modelInput = page.locator('input[name="model"]');
    this.yearInput = page.locator('input[name="year"]');
    this.vinInput = page.locator('input[name="vin"]');
    this.odometerInput = page.locator('input[name="odometer"]');
    this.fuelTypeSelect = page.locator('select[name="fuelType"], [name="fuelType"]');
    this.transmissionSelect = page.locator('select[name="transmissionType"], [name="transmissionType"]');
    this.carTypeSelect = page.locator('select[name="carType"], [name="carType"]');
    this.seaterCountInput = page.locator('input[name="seaterCount"]');
    this.bufferMinutesInput = page.locator('input[name="bufferMinutes"]');
    this.minRentalHoursInput = page.locator('input[name="minRentalHours"]');
    this.maxRentalDaysInput = page.locator('input[name="maxRentalDays"]');
    this.maxFutureBookingDaysInput = page.locator('input[name="maxFutureBookingDays"]');
    this.detailsTextarea = page.locator('textarea[name="details"]');
    this.nextButton = page.locator('button:has-text("Next")');
    this.previousButton = page.locator('button:has-text("Previous"), button:has-text("Back")');
    this.submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Update")');
    this.saveDraftButton = page.locator('button:has-text("Save Draft")');
    this.stepIndicators = page.locator('[class*="step"]');
  }

  async gotoNew() {
    await this.page.goto('/vehicles/new');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoEdit(vehicleId: string | number) {
    await this.page.goto(`/vehicles/${vehicleId}/edit`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillStep1(data: {
    name: string;
    licensePlate: string;
    status: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.licensePlateInput.fill(data.licensePlate);
    
    // Handle status selection (native select or custom dropdown)
    await this.selectDropdown(this.statusSelect, data.status);
  }

  async fillStep2(data: {
    make: string;
    model: string;
    year: number;
    vin: string;
    odometer: number;
    fuelType: string;
    transmissionType: string;
    carType: string;
    seaterCount: number;
  }) {
    // Wait for step 2 to be visible
    await this.makeInput.waitFor({ state: 'visible', timeout: 10000 });
    
    await this.makeInput.fill(data.make);
    await this.modelInput.fill(data.model);
    await this.yearInput.fill(String(data.year));
    
    // Check if VIN field exists and is visible
    if (await this.vinInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.vinInput.fill(data.vin);
    }
    
    // Check if odometer field exists and is visible
    if (await this.odometerInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.odometerInput.fill(String(data.odometer));
    }
    
    // Handle fuel type selection if field exists
    if (await this.fuelTypeSelect.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.selectDropdown(this.fuelTypeSelect, data.fuelType);
    }
    
    // Handle transmission selection if field exists
    if (await this.transmissionSelect.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.selectDropdown(this.transmissionSelect, data.transmissionType);
    }
    
    // Handle carType selection (required field)
    if (await this.carTypeSelect.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.selectDropdown(this.carTypeSelect, data.carType);
    }
    
    // Handle seaterCount input (required field)
    if (await this.seaterCountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.seaterCountInput.fill(String(data.seaterCount));
    }
  }

  async fillStep3(data: {
    bufferMinutes: number;
    minRentalHours: number;
    maxRentalDays: number;
    maxFutureBookingDays: number;
  }) {
    // Wait for step 3 to be visible
    await this.bufferMinutesInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    
    // Fill fields if they exist
    if (await this.bufferMinutesInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.bufferMinutesInput.fill(String(data.bufferMinutes));
    }
    if (await this.minRentalHoursInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.minRentalHoursInput.fill(String(data.minRentalHours));
    }
    if (await this.maxRentalDaysInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.maxRentalDaysInput.fill(String(data.maxRentalDays));
    }
    if (await this.maxFutureBookingDaysInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.maxFutureBookingDaysInput.fill(String(data.maxFutureBookingDays));
    }
  }

  async fillStep4(details: string) {
    // Wait for step 4 to be visible
    await this.detailsTextarea.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    
    if (await this.detailsTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.detailsTextarea.fill(details);
    }
  }

  async clickNext() {
    // Wait for Next button to be visible and enabled
    await this.nextButton.waitFor({ state: 'visible', timeout: 5000 });
    
    const isDisabled = await this.nextButton.isDisabled().catch(() => false);
    if (isDisabled) {
      console.log('Warning: Next button is disabled, may have validation errors');
    }
    
    await this.nextButton.click();
    
    // Wait for navigation/transition
    await TestHelpers.delay(800);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickPrevious() {
    await this.previousButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.previousButton.click();
    await TestHelpers.delay(500);
  }

  async clickSubmit() {
    // Wait for submit button to be enabled
    await this.submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.submitButton.click();
  }

  async saveDraft() {
    await this.saveDraftButton.click();
    await TestHelpers.delay(500);
  }

  async fillCompleteForm(data: any) {
    console.log('Starting fillCompleteForm with data:', { name: data.name, licensePlate: data.licensePlate });
    
    // Step 1: Basic Info
    console.log('Filling Step 1: Basic Info');
    await this.fillStep1({
      name: data.name,
      licensePlate: data.licensePlate,
      status: data.status,
    });
    
    // Check if Next button exists (multi-step form) or if all fields are on one page
    const hasNextButton = await this.nextButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasNextButton) {
      console.log('Multi-step form detected, clicking Next');
      await this.clickNext();
    } else {
      console.log('Single-page form detected, filling all fields at once');
    }

    // Step 2: Specifications
    console.log('Filling Step 2: Specifications');
    await this.fillStep2({
      make: data.make,
      model: data.model,
      year: data.year,
      vin: data.vin,
      odometer: data.odometer,
      fuelType: data.fuelType,
      transmissionType: data.transmissionType,
      carType: data.carType,
      seaterCount: data.seaterCount,
    });
    
    if (hasNextButton && await this.nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Clicking Next after Step 2');
      await this.clickNext();
    }

    // Step 3: Rental Settings
    console.log('Filling Step 3: Rental Settings');
    await this.fillStep3({
      bufferMinutes: data.bufferMinutes,
      minRentalHours: data.minRentalHours,
      maxRentalDays: data.maxRentalDays,
      maxFutureBookingDays: data.maxFutureBookingDays,
    });
    
    if (hasNextButton && await this.nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Clicking Next after Step 3');
      await this.clickNext();
    }

    // Step 4: Additional Details
    if (data.details) {
      console.log('Filling Step 4: Additional Details');
      await this.fillStep4(data.details);
      
      if (hasNextButton && await this.nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('Clicking Next after Step 4');
        await this.clickNext();
      }
    }

    console.log('fillCompleteForm completed');
    // Step 5: Pricing (optional - skip for now)
    // User can add pricing later
  }

  async verifyValidationError(fieldName: string) {
    const errorMessage = this.page.locator(`[name="${fieldName}"] ~ .text-destructive, [name="${fieldName}"] + .text-destructive`);
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  }

  async verifyNoValidationError(fieldName: string) {
    const errorMessage = this.page.locator(`[name="${fieldName}"] ~ .text-destructive, [name="${fieldName}"] + .text-destructive`);
    await expect(errorMessage).not.toBeVisible();
  }

  private async selectDropdown(locator: Locator, value: string) {
    const element = locator.first();
    
    // Check if it's a native HTML select element
    const tagName = await element.evaluate(el => el.tagName.toLowerCase()).catch(() => '');
    
    if (tagName === 'select') {
      // Native select - try by value first, then by label (case-sensitive)
      try {
        await element.selectOption(value);
      } catch {
        // Try with label
        await element.selectOption({ label: value });
      }
    } else {
      // Custom dropdown component (like shadcn/radix-ui Select)
      await element.click();
      await TestHelpers.delay(300); // Wait for dropdown animation
      
      // Try multiple selectors and case-insensitive matching for dropdown options
      const valuePattern = new RegExp(value, 'i');
      const option = this.page.locator(`
        [role="option"],
        [role="menuitem"],
        li[data-value],
        div[data-value],
        [class*="option"]
      `).filter({ hasText: valuePattern }).first();
      
      // Wait for option to be visible and clickable
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click({ timeout: 5000 });
    }
    
    await TestHelpers.delay(200); // Wait for selection to register
  }

  async getCurrentStep(): Promise<number> {
    // Try to determine current step from URL or indicators
    const activeSteps = await this.stepIndicators.filter({ hasText: /active|current/ }).count();
    return activeSteps;
  }

  async waitForFormLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.nameInput.waitFor({ state: 'visible', timeout: 10000 });
  }
}
