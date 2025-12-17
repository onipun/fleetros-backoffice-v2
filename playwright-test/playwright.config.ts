import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright configuration for vehicle CRUD tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Global test timeout - increased to handle network latency during full suite runs */
  timeout: 60000,
  
  /* Expect timeout - increased for elements that take time to appear */
  expect: {
    timeout: 15000,
  },
  
  /* Run tests in files in parallel */
  fullyParallel: false,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry failed tests once to handle flaky tests */
  retries: 1,
  
  /* Force single worker to prevent browser memory issues during full suite runs */
  workers: 1,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: './reports/html' }],
    ['json', { outputFile: './reports/results.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Maximum time each action such as `click()` can take */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'cd .. && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Always reuse existing server
    timeout: 120000,
  },
});
