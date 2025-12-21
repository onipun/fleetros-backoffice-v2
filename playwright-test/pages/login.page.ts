import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for Login Page
 */
export class LoginPage {
  readonly page: Page;
  readonly signInWithKeycloakButton: Locator;
  readonly keycloakUsernameInput: Locator;
  readonly keycloakPasswordInput: Locator;
  readonly keycloakLoginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Fleetros landing page button
    this.signInWithKeycloakButton = page.locator('button:has-text("Sign in with Keycloak")');
    
    // Keycloak login form elements
    this.keycloakUsernameInput = page.locator('input[name="username"], input#username');
    this.keycloakPasswordInput = page.locator('input[name="password"], input#password');
    this.keycloakLoginButton = page.locator('button[type="submit"], input[type="submit"]');
    
    this.errorMessage = page.locator('[role="alert"], .alert-error, .text-destructive');
  }

  async goto() {
    await this.page.goto('/');
  }

  /**
   * Complete Keycloak login flow:
   * 1. Click "Sign in with Keycloak" button on landing page
   * 2. Wait for redirect to Keycloak login page
   * 3. Enter credentials on Keycloak page
   * 4. Submit and wait for redirect back to application
   */
  async login(username: string, password: string) {
    // Step 1: Click "Sign in with Keycloak" button
    await this.signInWithKeycloakButton.click();
    
    // Step 2: Wait for Keycloak login page to load
    await this.page.waitForURL(/\/realms\/.*\/protocol\/openid-connect\/auth/, { timeout: 10000 });
    
    // Step 3: Enter credentials on Keycloak page
    await this.keycloakUsernameInput.fill(username);
    await this.keycloakPasswordInput.fill(password);
    
    // Step 4: Click login button and wait for redirect
    await this.keycloakLoginButton.click();
    
    // Wait for redirect back to application
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyErrorMessage(text: string) {
    await expect(this.errorMessage).toContainText(text);
  }
}
