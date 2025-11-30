import { expect, Page } from '@playwright/test';

export class ModificationPoliciesListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/settings/modification-policies');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickCreatePolicy() {
    await this.page.click('a[href="/settings/modification-policies/new"]');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async searchPolicy(policyName: string) {
    // Wait for table to load
    await this.page.waitForSelector('table', { timeout: 10000 });
    
    // Search in the table
    const searchInput = this.page.locator('input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill(policyName);
      await this.page.waitForTimeout(1000);
    }
  }

  async verifyPolicyExists(policyName: string) {
    await this.page.waitForSelector('table tbody', { timeout: 10000 });
    
    const row = this.page.locator('table tbody tr', { 
      hasText: policyName 
    });
    
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  async verifyPolicyNotExists(policyName: string) {
    // Wait a bit for the list to reload after deletion
    await this.page.waitForTimeout(1000);
    
    // Check if table exists
    const hasTable = await this.page.locator('table').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasTable) {
      const row = this.page.locator('table tbody tr', { 
        hasText: policyName 
      });
      await expect(row).not.toBeVisible({ timeout: 5000 });
    }
    // If no table, policy list is likely empty, which is fine for "not exists"
  }

  async clickEditPolicy(policyName: string) {
    const row = this.page.locator('table tbody tr', { 
      hasText: policyName 
    });
    
    await row.locator('a[href*="/edit"]').click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickDeletePolicy(policyName: string) {
    const row = this.page.locator('table tbody tr', { 
      hasText: policyName 
    });
    
    await row.locator('button:has-text(""), button[aria-label*="Delete"], button:has(svg)').last().click();
  }

  async confirmDelete() {
    await this.page.click('button:has-text("Delete")');
    await this.page.waitForTimeout(1000);
  }

  async cancelDelete() {
    await this.page.click('button:has-text("Cancel")');
  }

  async getPolicyTier(policyName: string): Promise<string> {
    const row = this.page.locator('table tbody tr', { 
      hasText: policyName 
    });
    
    const tierCell = row.locator('td').nth(1);
    return await tierCell.textContent() || '';
  }

  async verifyPolicyDetails(policyName: string, details: {
    tier?: string;
    freeWindow?: string;
    lateFee?: string;
    categoryFee?: string;
    locationFee?: string;
  }) {
    const row = this.page.locator('table tbody tr', { 
      hasText: policyName 
    });
    
    await expect(row).toBeVisible();
    
    if (details.tier) {
      await expect(row.locator('td').nth(1)).toContainText(details.tier);
    }
    if (details.freeWindow) {
      await expect(row.locator('td').nth(2)).toContainText(details.freeWindow);
    }
    if (details.lateFee) {
      await expect(row.locator('td').nth(3)).toContainText(details.lateFee);
    }
    if (details.categoryFee) {
      await expect(row.locator('td').nth(4)).toContainText(details.categoryFee);
    }
    if (details.locationFee) {
      await expect(row.locator('td').nth(5)).toContainText(details.locationFee);
    }
  }

  async getPolicyCount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    return await rows.count();
  }

  async verifyEmptyState() {
    await expect(this.page.locator('text=No policies found')).toBeVisible();
  }
}
