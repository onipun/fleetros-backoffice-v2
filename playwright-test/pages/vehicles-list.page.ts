import { Locator, Page, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Page Object Model for Vehicles List Page
 */
export class VehiclesListPage {
  readonly page: Page;
  readonly addVehicleButton: Locator;
  readonly searchInput: Locator;
  readonly vehicleCards: Locator;
  readonly emptyState: Locator;
  readonly loadingSkeleton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addVehicleButton = page.locator('a[href="/vehicles/new"], button:has-text("Add Vehicle")').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
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
    await this.searchInput.fill(searchTerm);
    await TestHelpers.delay(500); // Debounce
  }

  async getVehicleCardByName(name: string): Promise<Locator> {
    return this.page.locator(`text=${name}`).locator('..').locator('..');
  }

  async clickVehicleByName(name: string) {
    await this.page.locator(`text=${name}`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async verifyVehicleExists(name: string) {
    // Wait for page to load and refresh
    await this.page.waitForLoadState('networkidle');
    await TestHelpers.delay(1000);
    
    // Try multiple approaches to find the vehicle
    const vehicleLocator = this.page.locator(`
      :text("${name}"),
      [data-testid="vehicle-name"]:has-text("${name}"),
      h2:has-text("${name}"),
      h3:has-text("${name}"),
      .vehicle-name:has-text("${name}")
    `).first();
    
    // If not found, try reloading the page
    const isVisible = await vehicleLocator.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isVisible) {
      console.log(`Vehicle "${name}" not found, reloading page...`);
      await this.page.reload({ waitUntil: 'networkidle' });
      await TestHelpers.delay(1000);
    }
    
    await expect(vehicleLocator).toBeVisible({ timeout: 10000 });
  }

  async searchAndVerifyVehicle(name: string) {
    // Use search to handle pagination
    if (await this.searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.searchInput.clear();
      await this.searchInput.fill(name);
      await TestHelpers.delay(500); // Wait for search debounce
      console.log(`Searched for vehicle: ${name}`);
    }
    
    // Verify vehicle appears in filtered results
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
}
