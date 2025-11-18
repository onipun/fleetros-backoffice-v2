import { test } from '@playwright/test';

test('Debug: Check what vehicles are shown', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000');
  await page.fill('input[name="username"]', 'john.admin');
  await page.fill('input[name="password"]', 'a123456A!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
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
