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
  
  // New Inventory Management Fields
  readonly inventoryModeSelect: Locator;
  readonly consumableTypeSelect: Locator;
  readonly purchaseLimitPerBookingInput: Locator;
  
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
    
    // New Inventory Management Fields
    this.inventoryModeSelect = page.locator('select#inventoryMode');
    this.consumableTypeSelect = page.locator('select#consumableType');
    this.purchaseLimitPerBookingInput = page.locator('input#purchaseLimitPerBooking');
    
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
    name?: string;
    offeringType?: string;
    availability?: number;
    price?: number;
    maxQuantityPerBooking?: number;
    isMandatory?: boolean;
    description?: string;
    // New inventory management fields
    inventoryMode?: 'SHARED' | 'EXCLUSIVE';
    consumableType?: 'RETURNABLE' | 'CONSUMABLE' | 'SERVICE' | 'ACCOMMODATION';
    purchaseLimitPerBooking?: number | null;
  }) {
    if (data.name) {
      await this.nameInput.fill(data.name);
    }
    
    if (data.offeringType) {
      await this.offeringTypeSelect.selectOption(data.offeringType);
    }
    
    // Fill inventory management fields first (before availability/maxQuantity since EXCLUSIVE mode disables them)
    if (data.inventoryMode) {
      await this.inventoryModeSelect.selectOption(data.inventoryMode);
      // Wait a moment for auto-adjustment to take effect
      await this.page.waitForTimeout(300);
    }
    
    if (data.consumableType) {
      await this.consumableTypeSelect.selectOption(data.consumableType);
    }
    
    // Only fill availability if not disabled (EXCLUSIVE mode disables it)
    if (data.availability !== undefined) {
      const isDisabled = await this.availabilityInput.isDisabled();
      if (!isDisabled) {
        await this.availabilityInput.clear();
        await this.availabilityInput.fill(String(data.availability));
      }
    }
    
    if (data.price !== undefined) {
      await this.priceInput.clear();
      await this.priceInput.fill(String(data.price));
    }
    
    // Only fill maxQuantity if not disabled (EXCLUSIVE mode disables it)
    if (data.maxQuantityPerBooking !== undefined) {
      const isDisabled = await this.maxQuantityInput.isDisabled();
      if (!isDisabled) {
        await this.maxQuantityInput.clear();
        await this.maxQuantityInput.fill(String(data.maxQuantityPerBooking));
      }
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
    
    if (data.purchaseLimitPerBooking !== undefined && data.purchaseLimitPerBooking !== null) {
      await this.purchaseLimitPerBookingInput.clear();
      await this.purchaseLimitPerBookingInput.fill(String(data.purchaseLimitPerBooking));
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
    const purchaseLimitValue = await this.purchaseLimitPerBookingInput.inputValue();
    return {
      name: await this.nameInput.inputValue(),
      offeringType: await this.offeringTypeSelect.inputValue(),
      availability: await this.availabilityInput.inputValue(),
      price: await this.priceInput.inputValue(),
      maxQuantityPerBooking: await this.maxQuantityInput.inputValue(),
      isMandatory: (await this.isMandatoryCheckbox.getAttribute('aria-checked')) === 'true',
      description: await this.descriptionTextarea.inputValue(),
      inventoryMode: await this.inventoryModeSelect.inputValue(),
      consumableType: await this.consumableTypeSelect.inputValue(),
      purchaseLimitPerBooking: purchaseLimitValue ? purchaseLimitValue : null,
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
