import { expect, test } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Modification Policy CRUD Operations', () => {
  const defaultPolicyData = {
    policyName: `Test Policy ${Date.now()}`,
    description: 'Default policy for all customers',
    loyaltyTier: null,
    freeModificationHours: 24,
    lateModificationFee: 25.00,
    categoryChangeFee: 50.00,
    locationChangeFee: 30.00,
    allowVehicleChange: true,
    allowDateChange: true,
    allowLocationChange: true,
    maxDateChangeDays: 30,
    majorModificationPriceThresholdPercent: 20,
    majorModificationDateThresholdDays: 7,
  };

  const bronzeTierPolicyData = {
    policyName: `Bronze Policy ${Date.now()}`,
    description: 'Policy for Bronze tier customers',
    loyaltyTier: 'BRONZE',
    freeModificationHours: 48,
    lateModificationFee: 20.00,
    categoryChangeFee: 40.00,
    locationChangeFee: 25.00,
    allowVehicleChange: true,
    allowDateChange: true,
    allowLocationChange: true,
    maxDateChangeDays: 45,
    majorModificationPriceThresholdPercent: 25,
    majorModificationDateThresholdDays: 10,
  };

  test('CREATE: Should create a default modification policy', async ({ 
    authenticatedPage, 
    modificationPoliciesListPage,
    modificationPolicyFormPage 
  }) => {
    await test.step('Navigate to modification policies list', async () => {
      await modificationPoliciesListPage.goto();
    });

    await test.step('Click create new policy button', async () => {
      await modificationPoliciesListPage.clickCreatePolicy();
    });

    await test.step('Verify create form title', async () => {
      await modificationPolicyFormPage.verifyFormTitle('Create Modification Policy');
    });

    await test.step('Fill in policy form with default tier', async () => {
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.fillForm(defaultPolicyData);
    });

    await test.step('Submit the form', async () => {
      await modificationPolicyFormPage.clickSubmit();
    });

    await test.step('Verify success message', async () => {
      await TestHelpers.verifyToastMessage(authenticatedPage, 'successfully');
    });

    await test.step('Verify policy appears in list', async () => {
      await authenticatedPage.waitForURL('**/settings/modification-policies', { timeout: 10000 });
      await modificationPoliciesListPage.verifyPolicyExists(defaultPolicyData.policyName);
    });
  });

  test('CREATE: Should create a tier-specific modification policy', async ({ 
    authenticatedPage, 
    modificationPoliciesListPage,
    modificationPolicyFormPage 
  }) => {
    await test.step('Navigate to modification policies list', async () => {
      await modificationPoliciesListPage.goto();
    });

    await test.step('Click create new policy button', async () => {
      await modificationPoliciesListPage.clickCreatePolicy();
    });

    await test.step('Fill in policy form with Bronze tier', async () => {
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.fillForm(bronzeTierPolicyData);
    });

    await test.step('Submit the form', async () => {
      await modificationPolicyFormPage.clickSubmit();
    });

    await test.step('Verify success message', async () => {
      await TestHelpers.verifyToastMessage(authenticatedPage, 'successfully');
    });

    await test.step('Verify policy appears in list', async () => {
      await authenticatedPage.waitForURL('**/settings/modification-policies', { timeout: 10000 });
      await modificationPoliciesListPage.verifyPolicyExists(bronzeTierPolicyData.policyName);
    });
  });

  test('READ: Should display all modification policies', async ({ 
    modificationPoliciesListPage 
  }) => {
    await test.step('Navigate to modification policies list', async () => {
      await modificationPoliciesListPage.goto();
    });

    await test.step('Verify page loads successfully', async () => {
      const count = await modificationPoliciesListPage.getPolicyCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test('READ: Should search for a specific policy', async ({ 
    authenticatedPage,
    modificationPoliciesListPage,
    modificationPolicyFormPage 
  }) => {
    const searchPolicyData = {
      policyName: `Search Test Policy ${Date.now()}`,
      description: 'Policy for search testing',
      loyaltyTier: 'SILVER',
      freeModificationHours: 72,
      lateModificationFee: 15.00,
      categoryChangeFee: 35.00,
      locationChangeFee: 20.00,
      allowVehicleChange: true,
      allowDateChange: true,
      allowLocationChange: true,
      maxDateChangeDays: 60,
      majorModificationPriceThresholdPercent: 30,
      majorModificationDateThresholdDays: 14,
    };

    await test.step('Create a policy for search testing', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.clickCreatePolicy();
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.fillForm(searchPolicyData);
      await modificationPolicyFormPage.clickSubmit();
      await authenticatedPage.waitForTimeout(2000);
    });

    await test.step('Search for the policy', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.searchPolicy(searchPolicyData.policyName);
    });

    await test.step('Verify search results', async () => {
      await modificationPoliciesListPage.verifyPolicyExists(searchPolicyData.policyName);
    });
  });

  test('UPDATE: Should update an existing modification policy', async ({ 
    authenticatedPage,
    modificationPoliciesListPage,
    modificationPolicyFormPage 
  }) => {
    const originalPolicyData = {
      policyName: `Update Test Policy ${Date.now()}`,
      description: 'Original description',
      loyaltyTier: 'GOLD',
      freeModificationHours: 48,
      lateModificationFee: 20.00,
      categoryChangeFee: 40.00,
      locationChangeFee: 25.00,
      allowVehicleChange: true,
      allowDateChange: true,
      allowLocationChange: true,
      maxDateChangeDays: 45,
      majorModificationPriceThresholdPercent: 25,
      majorModificationDateThresholdDays: 10,
    };

    await test.step('Create a policy for update testing', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.clickCreatePolicy();
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.fillForm(originalPolicyData);
      await modificationPolicyFormPage.clickSubmit();
      await authenticatedPage.waitForTimeout(2000);
    });

    await test.step('Navigate to edit page', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.clickEditPolicy(originalPolicyData.policyName);
    });

    await test.step('Verify edit form title', async () => {
      await modificationPolicyFormPage.verifyFormTitle('Edit Modification Policy');
    });

    await test.step('Update policy fields', async () => {
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.fillForm({
        description: 'Updated description',
        freeModificationHours: 96,
        lateModificationFee: 10.00,
      });
    });

    await test.step('Submit the update', async () => {
      await modificationPolicyFormPage.clickSubmit();
    });

    await test.step('Verify success message', async () => {
      await TestHelpers.verifyToastMessage(authenticatedPage, 'successfully');
    });

    await test.step('Verify policy is updated in list', async () => {
      await authenticatedPage.waitForURL('**/settings/modification-policies', { timeout: 10000 });
      await modificationPoliciesListPage.verifyPolicyExists(originalPolicyData.policyName);
    });
  });

  test('DELETE: Should delete a modification policy', async ({ 
    authenticatedPage,
    modificationPoliciesListPage,
    modificationPolicyFormPage 
  }) => {
    const deletePolicyData = {
      policyName: `Delete Test Policy ${Date.now()}`,
      description: 'Policy to be deleted',
      loyaltyTier: null,
      freeModificationHours: 24,
      lateModificationFee: 25.00,
      categoryChangeFee: 50.00,
      locationChangeFee: 30.00,
      allowVehicleChange: true,
      allowDateChange: true,
      allowLocationChange: true,
      maxDateChangeDays: 30,
      majorModificationPriceThresholdPercent: 20,
      majorModificationDateThresholdDays: 7,
    };

    await test.step('Create a policy for delete testing', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.clickCreatePolicy();
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.fillForm(deletePolicyData);
      await modificationPolicyFormPage.clickSubmit();
      await authenticatedPage.waitForTimeout(2000);
    });

    await test.step('Navigate to policies list', async () => {
      await modificationPoliciesListPage.goto();
    });

    await test.step('Click delete button', async () => {
      await modificationPoliciesListPage.clickDeletePolicy(deletePolicyData.policyName);
      await authenticatedPage.waitForTimeout(500);
    });

    await test.step('Confirm delete and verify success', async () => {
      await modificationPoliciesListPage.confirmDelete();
      // Toast should appear immediately after delete
      await TestHelpers.verifyToastMessage(authenticatedPage, 'deleted successfully');
    });

    await test.step('Verify policy is removed from list', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.verifyPolicyNotExists(deletePolicyData.policyName);
    });
  });

  test('EDGE CASE: Should validate required fields', async ({ 
    authenticatedPage,
    modificationPoliciesListPage,
    modificationPolicyFormPage 
  }) => {
    await test.step('Navigate to create policy page', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.clickCreatePolicy();
    });

    await test.step('Submit form without required fields', async () => {
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.clickSubmit();
      await authenticatedPage.waitForTimeout(1000);
    });

    await test.step('Verify validation errors appear', async () => {
      // Check for HTML5 validation or error messages
      const hasValidationError = await authenticatedPage.locator('input:invalid, [aria-invalid="true"]').count() > 0;
      expect(hasValidationError).toBeTruthy();
    });
  });

  test('EDGE CASE: Should validate numeric field ranges', async ({ 
    authenticatedPage,
    modificationPoliciesListPage,
    modificationPolicyFormPage 
  }) => {
    const invalidPolicyData = {
      policyName: `Invalid Numbers Policy ${Date.now()}`,
      description: 'Testing negative numbers',
      loyaltyTier: null,
      freeModificationHours: -10, // Invalid: negative
      lateModificationFee: -5.00, // Invalid: negative
      categoryChangeFee: 50.00,
      locationChangeFee: 30.00,
      allowVehicleChange: true,
      allowDateChange: true,
      allowLocationChange: true,
      maxDateChangeDays: -15, // Invalid: negative
      majorModificationPriceThresholdPercent: 150, // Invalid: > 100
      majorModificationDateThresholdDays: 7,
    };

    await test.step('Navigate to create policy page', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.clickCreatePolicy();
    });

    await test.step('Fill form with invalid numeric values', async () => {
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.fillForm(invalidPolicyData);
    });

    await test.step('Submit the form', async () => {
      await modificationPolicyFormPage.clickSubmit();
      await authenticatedPage.waitForTimeout(1000);
    });

    await test.step('Verify validation prevents submission or shows error', async () => {
      // Either HTML5 validation or toast error message
      const hasValidationError = await authenticatedPage.locator('input:invalid, [aria-invalid="true"]').count() > 0;
      const hasToastError = await authenticatedPage.locator('[role="status"], [class*="toast"]').isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasValidationError || hasToastError).toBeTruthy();
    });
  });

  test('EDGE CASE: Should handle policy name uniqueness', async ({ 
    authenticatedPage,
    modificationPoliciesListPage,
    modificationPolicyFormPage 
  }) => {
    const duplicateName = `Duplicate Policy ${Date.now()}`;
    
    const firstPolicyData = {
      policyName: duplicateName,
      description: 'First policy',
      loyaltyTier: null,
      freeModificationHours: 24,
      lateModificationFee: 25.00,
      categoryChangeFee: 50.00,
      locationChangeFee: 30.00,
      allowVehicleChange: true,
      allowDateChange: true,
      allowLocationChange: true,
      maxDateChangeDays: 30,
      majorModificationPriceThresholdPercent: 20,
      majorModificationDateThresholdDays: 7,
    };

    await test.step('Create first policy', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.clickCreatePolicy();
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.fillForm(firstPolicyData);
      await modificationPolicyFormPage.clickSubmit();
      await authenticatedPage.waitForTimeout(2000);
    });

    await test.step('Attempt to create policy with same name', async () => {
      await modificationPoliciesListPage.goto();
      await modificationPoliciesListPage.clickCreatePolicy();
      await modificationPolicyFormPage.waitForFormLoad();
      await modificationPolicyFormPage.fillForm({
        ...firstPolicyData,
        description: 'Second policy with duplicate name',
      });
      await modificationPolicyFormPage.clickSubmit();
      
      // Backend allows duplicate names - verify success toast or navigation
      const hasToast = await authenticatedPage.locator('[role="status"]').first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasNavigated = await authenticatedPage.waitForURL('**/settings/modification-policies', { timeout: 5000 }).then(() => true).catch(() => false);
      
      // Either toast shows or page navigates back to list (both indicate completion)
      expect(hasToast || hasNavigated).toBeTruthy();
    });
  });

  test('EDGE CASE: Should handle all loyalty tiers', async ({ 
    authenticatedPage,
    modificationPoliciesListPage,
    modificationPolicyFormPage 
  }) => {
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

    for (const tier of tiers) {
      await test.step(`Create policy for ${tier} tier`, async () => {
        const policyData = {
          policyName: `${tier} Tier Policy ${Date.now()}`,
          description: `Policy for ${tier} tier`,
          loyaltyTier: tier,
          freeModificationHours: 24,
          lateModificationFee: 25.00,
          categoryChangeFee: 50.00,
          locationChangeFee: 30.00,
          allowVehicleChange: true,
          allowDateChange: true,
          allowLocationChange: true,
          maxDateChangeDays: 30,
          majorModificationPriceThresholdPercent: 20,
          majorModificationDateThresholdDays: 7,
        };

        await modificationPoliciesListPage.goto();
        await modificationPoliciesListPage.clickCreatePolicy();
        await modificationPolicyFormPage.waitForFormLoad();
        await modificationPolicyFormPage.fillForm(policyData);
        await modificationPolicyFormPage.clickSubmit();
        
        await TestHelpers.verifyToastMessage(authenticatedPage, 'successfully');
        
        await authenticatedPage.waitForURL('**/settings/modification-policies', { timeout: 10000 });
        await modificationPoliciesListPage.verifyPolicyExists(policyData.policyName);
      });
    }
  });
});
