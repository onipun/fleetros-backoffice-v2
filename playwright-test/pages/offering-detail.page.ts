import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for Offering Detail Page
 */
export class OfferingDetailPage {
  readonly page: Page;
  
  // Navigation
  readonly backButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  
  // Detail Sections
  readonly offeringName: Locator;
  readonly offeringType: Locator;
  readonly basicInfoCard: Locator;
  readonly descriptionCard: Locator;
  readonly imagesSection: Locator;
  readonly pricingSection: Locator;
  
  // Images
  readonly uploadButton: Locator;
  readonly mainImage: Locator;
  readonly thumbnails: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation
    this.backButton = page.locator('button:has-text("Back"), a:has-text("Back")').first();
    this.editButton = page.locator('a[href*="/edit"]:has-text("Edit")').first();
    this.deleteButton = page.locator('button:has-text("Delete")');
    
    // Detail Sections
    this.offeringName = page.locator('h1');
    this.offeringType = page.locator('h1 + p, .text-muted-foreground').first();
    // Find the card by looking for one that contains grid with Type/Price/Availability
    this.basicInfoCard = page.locator('div:has(span.text-muted-foreground:has-text("Type"))').locator('..').locator('..').first();
    this.descriptionCard = page.locator('div:has(span.text-muted-foreground:has-text("Description"))').locator('..').first();
    this.imagesSection = page.locator('text=/Images/i').locator('..');
    this.pricingSection = page.locator('text=/Pricing/i').locator('..');
    
    // Images
    this.uploadButton = page.locator('button:has-text("Upload")');
    this.mainImage = page.locator('img').first();
    this.thumbnails = page.locator('[class*="thumbnail"], [class*="grid"] img');
  }

  async goto(offeringId: string | number) {
    await this.page.goto(`/offerings/${offeringId}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get offering name
   */
  async getOfferingName(): Promise<string> {
    return (await this.offeringName.textContent()) || '';
  }

  /**
   * Get offering type
   */
  async getOfferingType(): Promise<string> {
    return (await this.offeringType.textContent()) || '';
  }

  /**
   * Get basic info details
   */
  async getBasicInfo() {
    // Simple approach: find the label span, go up to parent div, then find the p sibling
    const getText = async (labelText: string) => {
      try {
        const labelSpan = this.page.locator(`span.text-muted-foreground:has-text("${labelText}")`).first();
        await labelSpan.waitFor({ state: 'visible', timeout: 5000 });
        const parentDiv = labelSpan.locator('..');
        const value = await parentDiv.locator('p.font-medium').textContent();
        return value?.trim() || '';
      } catch (error) {
        console.warn(`Failed to find ${labelText}:`, error);
        return '';
      }
    };
    
    return {
      type: await getText('Type'),
      price: await getText('Price'),
      availability: await getText('Availability'),
      maxQuantity: await getText('Max'),
      mandatory: await getText('Mandatory'),
    };
  }

  /**
   * Get description text
   */
  async getDescription(): Promise<string> {
    try {
      // The description is in a p tag with specific classes
      const descText = this.page.locator('p.text-sm.text-muted-foreground.whitespace-pre-wrap').first();
      await descText.waitFor({ state: 'visible', timeout: 5000 });
      return (await descText.textContent())?.trim() || '';
    } catch (error) {
      console.warn('Failed to find description:', error);
      return '';
    }
  }

  /**
   * Verify basic info field value
   */
  async verifyBasicInfoField(fieldLabel: string, expectedValue: string | RegExp) {
    const field = this.basicInfoCard.locator(`text=${fieldLabel}`).locator('..').locator('p, span').last();
    
    if (typeof expectedValue === 'string') {
      await expect(field).toContainText(expectedValue);
    } else {
      await expect(field).toContainText(expectedValue);
    }
  }

  /**
   * Verify description
   */
  async verifyDescription(expectedText: string | RegExp) {
    const descText = this.descriptionCard.locator('p');
    
    if (typeof expectedText === 'string') {
      await expect(descText).toContainText(expectedText);
    } else {
      await expect(descText).toContainText(expectedText);
    }
  }

  /**
   * Click edit button
   */
  async clickEdit() {
    await this.editButton.click();
  }

  /**
   * Click delete button (with confirmation)
   */
  async clickDelete() {
    // Set up dialog handler
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    
    await this.deleteButton.click();
  }

  /**
   * Click back button
   */
  async clickBack() {
    await this.backButton.click();
  }

  /**
   * Verify images are displayed
   */
  async verifyHasImages() {
    await expect(this.mainImage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get number of images
   */
  async getImagesCount(): Promise<number> {
    return await this.thumbnails.count();
  }

  /**
   * Verify pricing section exists
   */
  async verifyPricingSectionExists() {
    await expect(this.pricingSection).toBeVisible({ timeout: 5000 });
  }
}
