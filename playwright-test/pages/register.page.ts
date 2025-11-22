import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for Registration Page
 */
export class RegisterPage {
  readonly page: Page;
  
  // Business Information Fields
  readonly accountNameInput: Locator;
  readonly accountDescriptionTextarea: Locator;
  readonly companyNameInput: Locator;
  readonly countrySelect: Locator;
  
  // Personal Information Fields
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly phoneNumberInput: Locator;
  
  // Account Credentials Fields
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly showPasswordButton: Locator;
  readonly showConfirmPasswordButton: Locator;
  
  // Form Actions
  readonly submitButton: Locator;
  readonly signInInsteadButton: Locator;
  
  // Error Messages
  readonly errorMessages: Locator;
  readonly toastMessages: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Business Information
    this.accountNameInput = page.locator('input#accountName');
    this.accountDescriptionTextarea = page.locator('textarea#accountDescription');
    this.companyNameInput = page.locator('input#companyName');
    this.countrySelect = page.locator('select#country');
    
    // Personal Information
    this.firstNameInput = page.locator('input#firstName');
    this.lastNameInput = page.locator('input#lastName');
    this.phoneNumberInput = page.locator('input#phoneNumber');
    
    // Account Credentials
    this.usernameInput = page.locator('input#username');
    this.emailInput = page.locator('input#email');
    this.passwordInput = page.locator('input#password');
    this.confirmPasswordInput = page.locator('input#confirmPassword');
    this.showPasswordButton = page.locator('button[type="button"]').filter({ has: page.locator('svg') }).nth(0);
    this.showConfirmPasswordButton = page.locator('button[type="button"]').filter({ has: page.locator('svg') }).nth(1);
    
    // Form Actions
    this.submitButton = page.locator('button[type="submit"]:has-text("Create Master Account")');
    this.signInInsteadButton = page.locator('button:has-text("Sign In Instead")');
    
    // Error Messages
    this.errorMessages = page.locator('.text-destructive, [role="alert"]');
    this.toastMessages = page.locator('[role="status"]');
  }

  async goto() {
    await this.page.goto('/register');
  }

  /**
   * Fill all registration fields with provided data
   */
  async fillRegistrationForm(data: {
    accountName: string;
    accountDescription?: string;
    companyName: string;
    country: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    // Business Information
    await this.accountNameInput.fill(data.accountName);
    if (data.accountDescription) {
      await this.accountDescriptionTextarea.fill(data.accountDescription);
    }
    await this.companyNameInput.fill(data.companyName);
    await this.countrySelect.selectOption(data.country);
    
    // Personal Information
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.phoneNumberInput.fill(data.phoneNumber);
    
    // Account Credentials
    await this.usernameInput.fill(data.username);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
  }

  /**
   * Fill only business information section
   */
  async fillBusinessInfo(data: {
    accountName: string;
    accountDescription?: string;
    companyName: string;
    country: string;
  }) {
    await this.accountNameInput.fill(data.accountName);
    if (data.accountDescription) {
      await this.accountDescriptionTextarea.fill(data.accountDescription);
    }
    await this.companyNameInput.fill(data.companyName);
    await this.countrySelect.selectOption(data.country);
  }

  /**
   * Fill only personal information section
   */
  async fillPersonalInfo(data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.phoneNumberInput.fill(data.phoneNumber);
  }

  /**
   * Fill only account credentials section
   */
  async fillCredentials(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    await this.usernameInput.fill(data.username);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
  }

  /**
   * Submit the registration form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility() {
    // Click the eye icon button next to password field
    const eyeButton = this.page.locator('input#password ~ button, input#password + button').first();
    await eyeButton.click();
  }

  /**
   * Toggle confirm password visibility
   */
  async toggleConfirmPasswordVisibility() {
    // Click the eye icon button next to confirm password field
    const eyeButton = this.page.locator('input#confirmPassword ~ button, input#confirmPassword + button').first();
    await eyeButton.click();
  }

  /**
   * Verify error message for a specific field
   */
  async verifyFieldError(fieldId: string, expectedText: string | RegExp) {
    const fieldError = this.page.locator(`#${fieldId}`).locator('../..').locator('.text-destructive');
    
    if (typeof expectedText === 'string') {
      await expect(fieldError).toContainText(expectedText);
    } else {
      await expect(fieldError).toContainText(expectedText);
    }
  }

  /**
   * Verify success toast message
   */
  async verifySuccessToast(expectedText: string | RegExp) {
    if (typeof expectedText === 'string') {
      const toast = this.toastMessages.filter({ hasText: expectedText });
      await expect(toast).toBeVisible({ timeout: 5000 });
    } else {
      const toast = this.toastMessages.filter({ hasText: expectedText });
      await expect(toast).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Verify error toast message
   */
  async verifyErrorToast(expectedText: string | RegExp) {
    if (typeof expectedText === 'string') {
      const toast = this.toastMessages.filter({ hasText: expectedText });
      await expect(toast).toBeVisible({ timeout: 5000 });
    } else {
      const toast = this.toastMessages.filter({ hasText: expectedText });
      await expect(toast).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Click "Sign In Instead" button
   */
  async clickSignInInstead() {
    await this.signInInsteadButton.click();
  }

  /**
   * Get current form values (for draft testing)
   */
  async getFormValues() {
    return {
      accountName: await this.accountNameInput.inputValue(),
      companyName: await this.companyNameInput.inputValue(),
      firstName: await this.firstNameInput.inputValue(),
      lastName: await this.lastNameInput.inputValue(),
      phoneNumber: await this.phoneNumberInput.inputValue(),
      username: await this.usernameInput.inputValue(),
      email: await this.emailInput.inputValue(),
    };
  }

  /**
   * Clear all form fields
   */
  async clearForm() {
    // Reload page to clear form completely (safer than clearing each field)
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.submitButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify required field asterisks are present
   */
  async verifyRequiredFields() {
    const requiredLabels = await this.page.locator('label:has(span.text-destructive:has-text("*"))').count();
    expect(requiredLabels).toBeGreaterThan(0);
  }
}
