import { test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('Debug: Check what vehicles are shown', async ({ page }) => {
  // Login using LoginPage with Keycloak flow
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  const username = process.env.TEST_USERNAME || 'john.admin';
  const password = process.env.TEST_PASSWORD || 'a123456A!';
  await loginPage.login(username, password);
  
  // Wait for redirect to dashboard after successful login
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
  
  // Go to vehicles page
  await page.goto('http://localhost:3000/vehicles');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Get all vehicle card titles
  const titles = await page.locator('h3').allTextContents();
  console.log('All h3 elements found:', titles);
  
  // Get all vehicle cards
  const cards = await page.locator('[class*="Card"]').count();
  console.log('Total cards found:', cards);
  
  // Check if search input exists
  const searchExists = await page.locator('input[type="search"]').isVisible();
  console.log('Search input exists:', searchExists);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-vehicle-list.png', fullPage: true });
  console.log('Screenshot saved to debug-vehicle-list.png');
});
