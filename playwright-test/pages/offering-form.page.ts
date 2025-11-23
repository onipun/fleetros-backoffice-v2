import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for Offering Form (Create/Edit)
 */
export class OfferingFormPage {
  readonly page: Page;
  
  // Form Fields
  readonly nameInput: Locator;
  readonly offeringTypeSelect: Locator;
  readonly availabilityInput: Locator;
  readonly priceInput: Locator;
  readonly maxQuantityInput: Locator;
  readonly isMandatoryCheckbox: Locator;
  readonly descriptionTextarea: Locator;
  
  // Form Actions
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form Fields
    this.nameInput = page.locator('input#name');
    this.offeringTypeSelect = page.locator('select#offeringType');
    this.availabilityInput = page.locator('input#availability');
    this.priceInput = page.locator('input#price');
    this.maxQuantityInput = page.locator('input#maxQuantityPerBooking');
    this.isMandatoryCheckbox = page.locator('button#isMandatory[role="checkbox"]');
    this.descriptionTextarea = page.locator('textarea#description');
    
    // Form Actions
    this.saveButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('a[href="/offerings"] button:has-text("Cancel")');
    this.backButton = page.locator('a[href="/offerings"] button:has-text("Back")');
  }

  async goto() {
    await this.page.goto('/offerings/new');
  }

  async gotoEdit(offeringId: string | number) {
    await this.page.goto(`/offerings/${offeringId}/edit`);
  }

  /**
   * Fill complete offering form
   */
  async fillForm(data: {
    name: string;
    offeringType?: string;
    availability?: number;
    price?: number;
    maxQuantityPerBooking?: number;
    isMandatory?: boolean;
    description?: string;
  }) {
    await this.nameInput.fill(data.name);
    
    if (data.offeringType) {
      await this.offeringTypeSelect.selectOption(data.offeringType);
    }
    
    if (data.availability !== undefined) {
      await this.availabilityInput.clear();
      await this.availabilityInput.fill(String(data.availability));
    }
    
    if (data.price !== undefined) {
      await this.priceInput.clear();
      await this.priceInput.fill(String(data.price));
    }
    
    if (data.maxQuantityPerBooking !== undefined) {
      await this.maxQuantityInput.clear();
      await this.maxQuantityInput.fill(String(data.maxQuantityPerBooking));
    }
    
    if (data.isMandatory !== undefined) {
      const currentState = await this.isMandatoryCheckbox.getAttribute('aria-checked');
      const isChecked = currentState === 'true';
      if ((data.isMandatory && !isChecked) || (!data.isMandatory && isChecked)) {
        await this.isMandatoryCheckbox.click();
      }
    }
    
    if (data.description) {
      await this.descriptionTextarea.fill(data.description);
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
    return {
      name: await this.nameInput.inputValue(),
      offeringType: await this.offeringTypeSelect.inputValue(),
      availability: await this.availabilityInput.inputValue(),
      price: await this.priceInput.inputValue(),
      maxQuantityPerBooking: await this.maxQuantityInput.inputValue(),
      isMandatory: (await this.isMandatoryCheckbox.getAttribute('aria-checked')) === 'true',
      description: await this.descriptionTextarea.inputValue(),
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
   * Click back button
   */
  async clickBack() {
    await this.backButton.click();
  }
}
