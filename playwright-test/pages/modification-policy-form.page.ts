import { Page } from '@playwright/test';

export class ModificationPolicyFormPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForFormLoad() {
    await this.page.waitForSelector('form', { timeout: 10000 });
  }

  async fillForm(data: {
    policyName?: string;
    description?: string;
    loyaltyTier?: string | null;
    freeModificationHours?: number;
    lateModificationFee?: number;
    categoryChangeFee?: number;
    locationChangeFee?: number;
    allowVehicleChange?: boolean;
    allowDateChange?: boolean;
    allowLocationChange?: boolean;
    maxDateChangeDays?: number;
    majorModificationPriceThresholdPercent?: number;
    majorModificationDateThresholdDays?: number;
  }) {
    if (data.policyName !== undefined) {
      await this.page.fill('input[name="policyName"], #policyName', data.policyName);
    }

    if (data.description !== undefined) {
      await this.page.fill('textarea[name="description"], #description', data.description);
    }

    if (data.loyaltyTier !== undefined) {
      // Click the select trigger
      await this.page.click('button:has-text("Select tier"), button[role="combobox"]');
      await this.page.waitForTimeout(500);
      
      if (data.loyaltyTier === null) {
        // Select "Default (All Customers)"
        await this.page.click('div[role="option"]:has-text("Default")');
      } else {
        await this.page.click(`div[role="option"]:has-text("${data.loyaltyTier}")`);
      }
    }

    if (data.freeModificationHours !== undefined) {
      await this.page.fill('input[name="freeModificationHours"], #freeModificationHours', data.freeModificationHours.toString());
    }

    if (data.lateModificationFee !== undefined) {
      await this.page.fill('input[name="lateModificationFee"], #lateModificationFee', data.lateModificationFee.toString());
    }

    if (data.categoryChangeFee !== undefined) {
      await this.page.fill('input[name="categoryChangeFee"], #categoryChangeFee', data.categoryChangeFee.toString());
    }

    if (data.locationChangeFee !== undefined) {
      await this.page.fill('input[name="locationChangeFee"], #locationChangeFee', data.locationChangeFee.toString());
    }

    if (data.allowVehicleChange !== undefined) {
      const checkbox = this.page.locator('input[name="allowVehicleChange"], #allowVehicleChange');
      const isChecked = await checkbox.isChecked();
      if (isChecked !== data.allowVehicleChange) {
        await checkbox.check();
      }
    }

    if (data.allowDateChange !== undefined) {
      const checkbox = this.page.locator('input[name="allowDateChange"], #allowDateChange');
      const isChecked = await checkbox.isChecked();
      if (isChecked !== data.allowDateChange) {
        await checkbox.check();
      }
    }

    if (data.allowLocationChange !== undefined) {
      const checkbox = this.page.locator('input[name="allowLocationChange"], #allowLocationChange');
      const isChecked = await checkbox.isChecked();
      if (isChecked !== data.allowLocationChange) {
        await checkbox.check();
      }
    }

    if (data.maxDateChangeDays !== undefined) {
      await this.page.fill('input[name="maxDateChangeDays"], #maxDateChangeDays', data.maxDateChangeDays.toString());
    }

    if (data.majorModificationPriceThresholdPercent !== undefined) {
      await this.page.fill('input[name="majorModificationPriceThresholdPercent"], #majorModificationPriceThresholdPercent', data.majorModificationPriceThresholdPercent.toString());
    }

    if (data.majorModificationDateThresholdDays !== undefined) {
      await this.page.fill('input[name="majorModificationDateThresholdDays"], #majorModificationDateThresholdDays', data.majorModificationDateThresholdDays.toString());
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
    await this.page.waitForSelector(`h1:has-text("${title}")`, { timeout: 5000 });
  }

  async verifyValidationError(message: string) {
    await this.page.waitForSelector(`text=${message}`, { timeout: 5000 });
  }
}
