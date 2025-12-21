import { Locator, Page } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export class DiscountFormPage {
  readonly page: Page;
  readonly codeInput: Locator;
  readonly statusSelect: Locator;
  readonly typeSelect: Locator;
  readonly valueInput: Locator;
  readonly scopeSelect: Locator;
  readonly minBookingAmountInput: Locator;
  readonly maxUsesInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  
  // Advanced fields
  readonly priorityInput: Locator;
  readonly autoApplyCheckbox: Locator;
  readonly requiresPromoCodeCheckbox: Locator;
  readonly combinableCheckbox: Locator;
  readonly firstTimeCustomerCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.codeInput = page.locator('input#code');
    this.statusSelect = page.locator('select#status');
    this.typeSelect = page.locator('select#type');
    this.valueInput = page.locator('input#value');
    this.scopeSelect = page.locator('select#scope');
    this.minBookingAmountInput = page.locator('input#minBookingAmount');
    this.maxUsesInput = page.locator('input#maxUses');
    this.descriptionTextarea = page.locator('textarea#description');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    
    this.priorityInput = page.locator('input#priority');
    this.autoApplyCheckbox = page.locator('button#autoApply, input#autoApply'); // Checkbox might be a button in shadcn
    this.requiresPromoCodeCheckbox = page.locator('button#requiresPromoCode, input#requiresPromoCode');
    this.combinableCheckbox = page.locator('button#combinableWithOtherDiscounts, input#combinableWithOtherDiscounts');
    this.firstTimeCustomerCheckbox = page.locator('button#firstTimeCustomerOnly, input#firstTimeCustomerOnly');
  }

  async gotoNew() {
    await this.page.goto('/discounts/new');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoEdit(discountId: string | number) {
    await this.page.goto(`/discounts/${discountId}/edit`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillForm(data: {
    code: string;
    status?: string;
    type?: string;
    value: number;
    scope?: string;
    validFrom?: string; // 'Today', 'Tomorrow', etc. for quick select
    validTo?: string;
    maxUses?: number;
    description?: string;
    priority?: number;
    autoApply?: boolean;
    requiresPromoCode?: boolean;
    selectedPackageNames?: string[];
    selectedOfferingNames?: string[];
  }) {
    await this.codeInput.fill(data.code);
    
    if (data.status) {
      await this.statusSelect.selectOption(data.status);
    }
    
    if (data.type) {
      await this.typeSelect.selectOption(data.type);
    }
    
    await this.valueInput.fill(String(data.value));
    
    if (data.scope) {
      await this.scopeSelect.selectOption(data.scope);
    }
    
    if (data.maxUses) {
      await this.maxUsesInput.fill(String(data.maxUses));
    }
    
    if (data.description) {
      await this.descriptionTextarea.fill(data.description);
    }

    // Handle Dates
    if (data.validFrom) {
      await this.selectDate('validFrom', data.validFrom);
    }
    if (data.validTo) {
      await this.selectDate('validTo', data.validTo);
    }

    // Handle Advanced Fields
    if (data.priority !== undefined) {
      await this.priorityInput.fill(String(data.priority));
    }

    if (data.autoApply !== undefined) {
      await this.setCheckbox(this.autoApplyCheckbox, data.autoApply);
    }

    if (data.requiresPromoCode !== undefined) {
      await this.setCheckbox(this.requiresPromoCodeCheckbox, data.requiresPromoCode);
    }

    // Handle Multi-Select for Package/Offering
    if (data.selectedPackageNames && data.selectedPackageNames.length > 0) {
      await this.selectEntities('package', data.selectedPackageNames);
    }

    if (data.selectedOfferingNames && data.selectedOfferingNames.length > 0) {
      await this.selectEntities('offering', data.selectedOfferingNames);
    }
  }

  async selectEntities(type: 'package' | 'offering', names: string[]) {
    // Wait for the list to load (look for search input or list items)
    const searchInput = this.page.locator(`input[placeholder*="Search ${type}s"]`);
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });

    for (const name of names) {
      // Filter the list if needed (optional, but good for reliability)
      await searchInput.fill(name);
      await TestHelpers.delay(500); // Wait for filter

      // Find the label with the exact text (or contains)
      // We use a more flexible locator to find the label containing the text
      const label = this.page.locator('label').filter({ hasText: name }).first();
      
      if (await label.isVisible()) {
        // Get the ID from the 'for' attribute
        const forAttribute = await label.getAttribute('for');
        if (forAttribute) {
          const checkbox = this.page.locator(`#${forAttribute}`); // ID selector needs escaping if it has special chars, but here it should be safe
          // Or use the button[role="checkbox"] associated with it if ID lookup fails (shadcn sometimes uses button)
          
          // Check if it's a button (shadcn checkbox)
          const isButton = await this.page.locator(`button[id="${forAttribute}"]`).count() > 0;
          const target = isButton ? this.page.locator(`button[id="${forAttribute}"]`) : checkbox;

          const isChecked = await target.getAttribute('aria-checked') === 'true';
          if (!isChecked) {
            await target.click();
          }
        } else {
           // Fallback: click the label
           await label.click();
        }
      } else {
        console.warn(`Entity "${name}" not found in multi-select`);
        // Try to find by text in the whole list item if label fails
        const item = this.page.locator('div').filter({ hasText: name }).last(); // Last might be the most specific
        if (await item.isVisible()) {
            await item.click();
        }
      }
    }
  }

  async selectDate(fieldId: 'validFrom' | 'validTo', quickSelectOption: string) {
    // Find the button associated with the label
    // Structure: Label(for=fieldId) -> DateTimePicker -> Button
    // We can find the button by looking for the one following the label
    
    // Find the label first
    const label = this.page.locator(`label[for="${fieldId}"]`);
    
    // Find the button that is a sibling or descendant of the container
    // A robust way is to find the button with an icon (calendar/clock) that is near this label
    // Or simply use the ID if the DateTimePicker passes it down (it usually doesn't pass ID to the button itself)
    
    // Let's try to find the button within the same container as the label
    // Assuming standard layout: div > label + div > button
    const container = label.locator('..');
    const dateButton = container.locator('button').filter({ has: this.page.locator('svg') }).first();
    
    if (await dateButton.isVisible()) {
      await dateButton.click();
      await TestHelpers.delay(500);
      
      // Click the quick select option
      const option = this.page.locator(`button:has-text("${quickSelectOption}")`).first();
      if (await option.isVisible()) {
        await option.click();
        await TestHelpers.delay(500);
      } else {
        console.warn(`Quick select option "${quickSelectOption}" not found for ${fieldId}`);
        // Close popover if failed
        await this.page.keyboard.press('Escape');
      }
    }
  }

  async setCheckbox(locator: Locator, checked: boolean) {
    const isChecked = await locator.getAttribute('aria-checked') === 'true' || await locator.isChecked().catch(() => false);
    if (isChecked !== checked) {
      await locator.click();
    }
  }

  async clickSubmit() {
    await this.submitButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForFormLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.codeInput.waitFor({ state: 'visible', timeout: 10000 });
  }
}
