import { Locator, Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Page Object Model for Vehicles List Page
 */
export class VehiclesListPage {
  readonly page: Page;
  readonly addVehicleButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly searchModeSelect: Locator;
  readonly carTypeFilter: Locator;
  readonly seaterCountInput: Locator;
  readonly vehicleCards: Locator;
  readonly emptyState: Locator;
  readonly loadingSkeleton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addVehicleButton = page.locator('a[href="/vehicles/new"], button:has-text("Add Vehicle")').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="vehicle"], input[placeholder*="Search"]');
    this.searchButton = page.locator('button:has-text("Search"), button[type="submit"]').first();
    this.searchModeSelect = page.locator('select[name="searchMode"]');
    this.carTypeFilter = page.locator('select[name="carType"]');
    this.seaterCountInput = page.locator('input[name="seaterCount"]');
    // Count vehicle cards by counting "View Details" buttons (each card has one)
    this.vehicleCards = page.locator('button:has-text("View Details")');
    this.emptyState = page.locator('text=No vehicles found');
    this.loadingSkeleton = page.locator('[class*="skeleton"]');
  }

  async goto() {
    await this.page.goto('/vehicles');
    await this.page.waitForLoadState('networkidle');
  }

  async clickAddVehicle() {
    // Use .first() to handle multiple "Add Vehicle" buttons on the page
    await this.addVehicleButton.click();
    await this.page.waitForURL('**/vehicles/new');
  }

  async searchVehicle(searchTerm: string) {
    // Click "By Name" button to enable name search
    const byNameButton = this.page.getByRole('button', { name: 'By Name' });
    if (await byNameButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await byNameButton.click();
      await TestHelpers.delay(1000); // Wait for React state update and input render
    }
    
    // Wait for search input to appear
    await this.searchInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    // Fill search term
    await this.searchInput.fill(searchTerm);
    
    // Click search button to trigger search (exact match to avoid "Advanced Search")
    const searchButton = this.page.getByRole('button', { name: 'Search', exact: true });
    await searchButton.waitFor({ state: 'visible', timeout: 3000 });
    await searchButton.click();
    
    await TestHelpers.delay(1500); // Wait for search to complete
    await this.page.waitForLoadState('networkidle');
  }

  async getVehicleCardByName(name: string): Promise<Locator> {
    return this.page.locator(`text=${name}`).locator('..').locator('..');
  }

  async clickVehicleByName(name: string) {
    await this.page.locator(`text=${name}`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyVehicleExists(name: string) {
    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
    await TestHelpers.delay(1000);
    
    // Look for exact vehicle name match - use getByRole for CardTitle (h3)
    // CardTitle renders as h3 with exact text match
    const vehicleLocator = this.page.getByRole('heading', { name: name, exact: true });
    
    // If not found, try reloading the page once
    const isVisible = await vehicleLocator.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isVisible) {
      console.log(`Vehicle "${name}" not found on first attempt, reloading page...`);
      await this.page.reload({ waitUntil: 'networkidle' });
      await TestHelpers.delay(1500);
    }
    
    await expect(vehicleLocator).toBeVisible({ timeout: 15000 });
  }

  async searchAndVerifyVehicle(name: string) {
    // Wait for page to be fully loaded
    await this.page.waitForLoadState('networkidle');
    await TestHelpers.delay(500);
    
    // Click "By Name" button to switch to name search mode
    const byNameButton = this.page.getByRole('button', { name: 'By Name' });
    if (await byNameButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`Clicking "By Name" button to enable name search`);
      await byNameButton.click();
      await TestHelpers.delay(1000); // Wait for React state update and input render
    }
    
    // Wait for search input to appear after selecting name mode
    // The input appears conditionally when searchMode is 'name'
    const searchInputAppeared = await this.searchInput
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    
    if (!searchInputAppeared) {
      console.log('Search input did not appear after clicking By Name button');
    }
    
    // Use search to handle pagination - search by full name for exact match
    if (await this.searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.searchInput.clear();
      await TestHelpers.delay(300); // Wait for clear
      await this.searchInput.fill(name); // Fill complete name for exact search
      console.log(`Filled search input with: "${name}"`);
      
      // MUST click search button to trigger the search (exact match to avoid "Advanced Search")
      const searchButton = this.page.getByRole('button', { name: 'Search', exact: true });
      await searchButton.waitFor({ state: 'visible', timeout: 3000 });
      console.log(`Clicking Search button to execute search`);
      await searchButton.click();
      
      // Wait for search API call to complete and results to render
      await TestHelpers.delay(1500);
      await this.page.waitForLoadState('networkidle');
      await TestHelpers.delay(500); // Extra time for UI to update
      console.log(`Search completed and results loaded`);
    } else {
      console.log(`Search input not found, proceeding to verify vehicle exists`);
    }
    
    // Verify vehicle appears in filtered results with exact name match
    await this.verifyVehicleExists(name);
  }

  async verifyVehicleNotExists(name: string) {
    await this.page.waitForLoadState('networkidle');
    const vehicleLocator = this.page.locator(`:text("${name}")`);
    await expect(vehicleLocator).not.toBeVisible();
  }

  async getVehicleCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle');
    await TestHelpers.delay(500);
    
    // Wait for either vehicles to load or empty state
    await Promise.race([
      this.page.locator('button:has-text("View Details")').first().waitFor({ timeout: 5000 }).catch(() => {}),
      this.emptyState.waitFor({ timeout: 5000 }).catch(() => {})
    ]);
    
    const count = await this.vehicleCards.count();
    return count;
  }

  async waitForVehiclesToLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.loadingSkeleton.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => null);
  }

  async selectSearchMode(mode: string) {
    if (await this.searchModeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.searchModeSelect.selectOption(mode);
      await TestHelpers.delay(500);
    }
  }

  async filterByCarType(carType: string) {
    if (await this.carTypeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.carTypeFilter.selectOption(carType);
      await TestHelpers.delay(500);
    }
  }

  async filterBySeaterCount(count: number) {
    if (await this.seaterCountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.seaterCountInput.fill(String(count));
      await TestHelpers.delay(500);
    }
  }

  async clearFilters() {
    // Clear search input
    if (await this.searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.searchInput.clear();
    }
    
    // Reset search mode to 'all'
    if (await this.searchModeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.searchModeSelect.selectOption('all');
    }
    
    await TestHelpers.delay(500);
  }
}
