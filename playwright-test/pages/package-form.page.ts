import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for Package Form (Create/Edit)
 */
export class PackageFormPage {
  readonly page: Page;
  
  // Form Fields
  readonly nameInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly priceModifierInput: Locator;
  readonly modifierTypeSelect: Locator;
  readonly allowDiscountOnModifierCheckbox: Locator;
  readonly validFromButton: Locator;
  readonly validToButton: Locator;
  readonly minRentalDaysInput: Locator;
  
  // Offering Selection
  readonly offeringCheckboxes: Locator;
  
  // Form Actions
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form Fields
    this.nameInput = page.locator('input#name');
    this.descriptionTextarea = page.locator('textarea#description');
    this.priceModifierInput = page.locator('input#priceModifier');
    this.modifierTypeSelect = page.locator('select#modifierType');
    this.allowDiscountOnModifierCheckbox = page.locator('button[role="checkbox"]').filter({ has: page.locator('[name="allowDiscountOnModifier"]') }).or(page.locator('button#allowDiscountOnModifier[role="checkbox"]'));
    this.validFromButton = page.locator('label:has-text("Valid From")').locator('..').locator('button').first();
    this.validToButton = page.locator('label:has-text("Valid To")').locator('..').locator('button').first();
    this.minRentalDaysInput = page.locator('input#minRentalDays');
    
    // Offering Selection
    this.offeringCheckboxes = page.locator('button[role="checkbox"][data-offering-id]');
    
    // Form Actions
    this.saveButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('a[href="/packages"] button:has-text("Cancel")');
  }

  async goto() {
    await this.page.goto('/packages/new');
  }

  async gotoEdit(packageId: string | number) {
    await this.page.goto(`/packages/${packageId}/edit`);
  }

  /**
   * Fill complete package form
   */
  async fillForm(data: {
    name: string;
    description?: string;
    priceModifier?: number;
    modifierType?: 'FIXED' | 'PERCENTAGE';
    allowDiscountOnModifier?: boolean;
    validFrom?: string;
    validTo?: string;
    minRentalDays?: number;
    offeringIds?: string[];
  }) {
    await this.nameInput.fill(data.name);
    
    if (data.description !== undefined) {
      await this.descriptionTextarea.fill(data.description);
    }
    
    if (data.priceModifier !== undefined) {
      await this.priceModifierInput.clear();
      await this.priceModifierInput.fill(String(data.priceModifier));
    }
    
    if (data.modifierType) {
      await this.modifierTypeSelect.selectOption(data.modifierType);
    }
    
    if (data.allowDiscountOnModifier !== undefined) {
      const checkbox = this.allowDiscountOnModifierCheckbox.first();
      const currentState = await checkbox.getAttribute('aria-checked');
      const isChecked = currentState === 'true';
      if ((data.allowDiscountOnModifier && !isChecked) || (!data.allowDiscountOnModifier && isChecked)) {
        await checkbox.click();
      }
    }
    
    if (data.validFrom) {
      if (typeof data.validFrom === 'string' && (data.validFrom === 'Today' || data.validFrom.includes('Start of') || data.validFrom.includes('End of'))) {
        // Quick select option
        await this.selectDateQuick('validFrom', data.validFrom);
      } else {
        // ISO date string
        await this.selectDateQuick('validFrom', 'Today'); // Fallback to Today for now
      }
    }
    
    if (data.validTo) {
      if (typeof data.validTo === 'string' && (data.validTo === 'Today' || data.validTo.includes('Start of') || data.validTo.includes('End of'))) {
        // Quick select option
        await this.selectDateQuick('validTo', data.validTo);
      } else {
        // ISO date string
        await this.selectDateQuick('validTo', 'End of Month'); // Fallback for future date
      }
    }
    
    if (data.minRentalDays !== undefined) {
      await this.minRentalDaysInput.clear();
      await this.minRentalDaysInput.fill(String(data.minRentalDays));
    }
    
    // Select offerings if provided
    if (data.offeringIds && data.offeringIds.length > 0) {
      await this.selectOfferings(data.offeringIds);
    }
  }

  /**
   * Select offerings by ID
   */
  async selectOfferings(offeringIds: string[]) {
    for (const offeringId of offeringIds) {
      const checkbox = this.page.locator(`button[role="checkbox"][data-offering-id="${offeringId}"]`);
      const isVisible = await checkbox.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        const currentState = await checkbox.getAttribute('aria-checked');
        if (currentState !== 'true') {
          await checkbox.click();
        }
      }
    }
  }

  /**
   * Submit the form
   */
  async submit() {
    await this.saveButton.click();
  }

  /**
   * Get current form values
   */
  async getFormValues() {
    const checkbox = this.allowDiscountOnModifierCheckbox.first();
    const validFromText = await this.validFromButton.textContent() || '';
    const validToText = await this.validToButton.textContent() || '';
    
    return {
      name: await this.nameInput.inputValue(),
      description: await this.descriptionTextarea.inputValue(),
      priceModifier: await this.priceModifierInput.inputValue(),
      modifierType: await this.modifierTypeSelect.inputValue(),
      allowDiscountOnModifier: (await checkbox.getAttribute('aria-checked')) === 'true',
      validFrom: validFromText,
      validTo: validToText,
      minRentalDays: await this.minRentalDaysInput.inputValue(),
    };
  }

  /**
   * Wait for form to load
   */
  async waitForFormLoad() {
    await expect(this.nameInput).toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Verify field error
   */
  async verifyFieldError(fieldName: string, expectedText?: string | RegExp) {
    const errorLocator = this.page.locator(`.text-destructive, [role="alert"]`).filter({ hasText: expectedText || new RegExp(fieldName, 'i') });
    await expect(errorLocator.first()).toBeVisible({ timeout: 3000 });
  }

  /**
   * Click cancel button
   */
  async clickCancel() {
    await this.cancelButton.click();
  }

  /**
   * Get selected offering count
   */
  async getSelectedOfferingsCount(): Promise<number> {
    const checkboxes = await this.offeringCheckboxes.all();
    let count = 0;
    
    for (const checkbox of checkboxes) {
      const state = await checkbox.getAttribute('aria-checked');
      if (state === 'true') {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Select date using quick select dropdown
   */
  async selectDateQuick(fieldId: 'validFrom' | 'validTo', quickSelectOption: string) {
    // Use the appropriate button locator based on field ID
    const dateButton = fieldId === 'validFrom' ? this.validFromButton : this.validToButton;
    
    // Get initial button text to verify the date was set
    const initialText = await dateButton.textContent();
    
    // Click to open dropdown
    await dateButton.click();
    await this.page.waitForTimeout(1000);
    
    // Wait for the dropdown to be visible
    const dropdown = this.page.locator('.absolute.top-full.z-50').first();
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    
    // Click the quick select option - use a more robust selector
    const option = this.page.getByRole('button').filter({ hasText: new RegExp(quickSelectOption) }).first();
    await option.waitFor({ state: 'visible', timeout: 3000 });
    await option.click();
    
    // Wait for the date picker dropdown to close and value to update
    await dropdown.waitFor({ state: 'hidden', timeout: 5000 });
    await this.page.waitForTimeout(1000);
    
    // Verify the button text changed (date was set)
    const newText = await dateButton.textContent();
    if (newText === initialText && initialText?.includes('Select')) {
      throw new Error(`Date not set for ${fieldId} - button text did not change from placeholder`);
    }
  }
}
