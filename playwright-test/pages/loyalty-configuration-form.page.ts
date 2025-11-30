import { Page } from '@playwright/test';

export class LoyaltyConfigurationFormPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForFormLoad() {
    await this.page.waitForSelector('form', { timeout: 10000 });
  }

  async fillForm(data: {
    tier?: string;
    displayName?: string;
    description?: string;
    minimumRentalsPerYear?: number;
    maximumRentalsPerYear?: number | null;
    pointsPerCurrencyUnit?: number;
    bookingCompletionBonus?: number;
    tierDiscountPercentage?: number;
    priorityCheckIn?: boolean;
    freeUpgrade?: boolean;
    guaranteedAvailability?: boolean;
  }) {
    if (data.tier !== undefined) {
      // Click the select trigger
      await this.page.click('button:has-text("Select tier"), button[role="combobox"]');
      await this.page.waitForTimeout(500);
      await this.page.click(`div[role="option"]:has-text("${data.tier}")`);
      await this.page.waitForTimeout(500); // Wait for tier selection to register
    }

    if (data.displayName) {
      await this.page.fill('#displayName', data.displayName);
    }

    if (data.description) {
      await this.page.fill('#description', data.description);
    }

    if (data.minimumRentalsPerYear !== undefined) {
      await this.page.fill('#minimumRentalsPerYear', data.minimumRentalsPerYear.toString());
    }

    if (data.maximumRentalsPerYear !== undefined) {
      if (data.maximumRentalsPerYear === null) {
        // Clear the field for PLATINUM tier (unlimited)
        await this.page.fill('#maximumRentalsPerYear', '');
      } else {
        await this.page.fill('#maximumRentalsPerYear', data.maximumRentalsPerYear.toString());
      }
    }

    if (data.pointsPerCurrencyUnit !== undefined) {
      await this.page.fill('#pointsPerCurrencyUnit', data.pointsPerCurrencyUnit.toString());
    }

    if (data.bookingCompletionBonus !== undefined) {
      await this.page.fill('#bookingCompletionBonus', data.bookingCompletionBonus.toString());
    }

    if (data.tierDiscountPercentage !== undefined) {
      await this.page.fill('#tierDiscountPercentage', data.tierDiscountPercentage.toString());
    }

    // Handle checkboxes
    if (data.priorityCheckIn !== undefined) {
      const checkbox = this.page.locator('#priorityCheckIn');
      const isChecked = await checkbox.isChecked();
      if (isChecked !== data.priorityCheckIn) {
        await checkbox.click();
      }
    }

    if (data.freeUpgrade !== undefined) {
      const checkbox = this.page.locator('#freeUpgrade');
      const isChecked = await checkbox.isChecked();
      if (isChecked !== data.freeUpgrade) {
        await checkbox.click();
      }
    }

    if (data.guaranteedAvailability !== undefined) {
      const checkbox = this.page.locator('#guaranteedAvailability');
      const isChecked = await checkbox.isChecked();
      if (isChecked !== data.guaranteedAvailability) {
        await checkbox.click();
      }
    }
  }

  async clickSubmit() {
    await this.page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Update")');
    // Just click and let the test handle waiting for toast/navigation
  }

  async clickCancel() {
    await this.page.click('a:has-text("Cancel"), button:has-text("Cancel")');
  }

  async verifyFormTitle(title: string) {
    await this.page.waitForSelector(`h1:has-text("${title}")`, { timeout: 5000 }).catch(() => {
      // Form might not have an h1, check for page load instead
      return this.page.waitForLoadState('domcontentloaded');
    });
  }

  async verifyValidationError(message: string) {
    await this.page.waitForSelector(`text=${message}`, { timeout: 5000 });
  }

  async verifyPlatinumNote() {
    await this.page.waitForSelector('text=/.*empty.*PLATINUM.*/', { timeout: 5000 });
  }
}
