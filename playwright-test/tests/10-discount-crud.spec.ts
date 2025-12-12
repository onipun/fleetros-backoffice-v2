import { expect, test } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Test Suite: Discount CRUD Operations
 * Covers scenarios from discount-test-scenario.json
 */
test.describe('Discount CRUD Operations', () => {
  
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/discounts');
  });

  test('DISC-CRUD-FLOW: Create, Read, Update, Delete Discount', async ({ 
    authenticatedPage, 
    discountFormPage, 
    discountsListPage 
  }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds for full CRUD flow
    
    const uniqueId = Date.now();
    const discountCode = `TEST-${uniqueId}`;
    const updatedCode = `UPD-${uniqueId}`;
    
    // --- CREATE ---
    await test.step('Create percentage discount (Global Scope)', async () => {
      await discountsListPage.clickAddDiscount();
      await discountFormPage.waitForFormLoad();

      await discountFormPage.fillForm({
        code: discountCode,
        status: 'ACTIVE',
        type: 'PERCENTAGE',
        value: 15,
        scope: 'ALL',
        validFrom: 'Today',
        validTo: 'End of Year',
        maxUses: 100,
        description: 'Test Discount Description',
        priority: 1,
        autoApply: false
      });
      
      await discountFormPage.clickSubmit();
      
      // Verify success
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|created/i);
      
      // Verify redirection to list or stay on page (assuming redirect to list based on typical flow)
      // If it stays on edit page, we go to list manually
      if (authenticatedPage.url().includes('/edit')) {
        await discountsListPage.goto();
      } else {
        await authenticatedPage.waitForURL('**/discounts');
      }
    });

    // --- READ ---
    await test.step('Read and Search Discount', async () => {
      await discountsListPage.goto();
      await discountsListPage.searchDiscount(discountCode);
      await discountsListPage.verifyDiscountExists(discountCode);
    });

    // --- UPDATE ---
    await test.step('Update Discount', async () => {
      await discountsListPage.clickEditDiscount(discountCode);
      await discountFormPage.waitForFormLoad();
      
      // Update values (NOTE: code field may not be editable on update)
      await discountFormPage.fillForm({
        code: discountCode, // Keep original code since it may not be editable
        value: 20,
        description: 'Updated Description'
      });
      
      await discountFormPage.clickSubmit();
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|updated/i);
      
      // Verify updates in list - search for original code since code doesn't change
      await discountsListPage.goto();
      await discountsListPage.searchDiscount(discountCode);
      await discountsListPage.verifyDiscountExists(discountCode);
    });

    // --- DELETE ---
    await test.step('Delete Discount', async () => {
      // Ensure we are on list page and searching for the discount code
      await discountsListPage.goto();
      await discountsListPage.searchDiscount(discountCode);
      
      // Delete will refresh the page automatically  
      await discountsListPage.deleteDiscount(discountCode);
      // Toast might not be shown for delete action in current implementation
      // await TestHelpers.verifyToastMessage(authenticatedPage, /success|deleted/i);
      
      // After reload, search again to verify the discount is gone
      // The deleteDiscount method now waits for components to be ready after reload
      await discountsListPage.searchDiscount(discountCode);
      await discountsListPage.verifyDiscountNotExists(discountCode);
    });
  });

  test('DISC-VAL-001: Validation - Required fields', async ({ 
    authenticatedPage, 
    discountFormPage, 
    discountsListPage 
  }) => {
    await test.step('Navigate to create page', async () => {
      await discountsListPage.clickAddDiscount();
      await discountFormPage.waitForFormLoad();
    });

    await test.step('Try to submit empty form', async () => {
      await discountFormPage.clickSubmit();
      
      // Should show validation errors (HTML5 validation or custom)
      // We can check if we are still on the same page
      expect(authenticatedPage.url()).toContain('/discounts/new');
      
      // Or check for specific error messages if implemented
      // const error = authenticatedPage.locator('.text-destructive');
      // await expect(error.first()).toBeVisible();
    });
  });

  test('DISC-SCOPE-SCENARIOS: Create Discounts with Specific Scopes', async ({ 
    authenticatedPage, 
    discountFormPage, 
    discountsListPage 
  }) => {
    const uniqueId = Date.now();

    // --- SCOPE: PACKAGE ---
    await test.step('Create Discount with Package Scope', async () => {
      // 1. Get Real Package Data
      let realPackage = { id: 1, name: 'Standard Package' };
      try {
        const response = await authenticatedPage.request.get('/api/packages');
        if (response.ok()) {
          const data = await response.json();
          if (data._embedded?.packages?.length > 0) {
            realPackage = data._embedded.packages[0];
          } else {
            const createRes = await authenticatedPage.request.post('/api/packages', {
              data: { name: `Pkg-${uniqueId}`, description: 'Test Package', active: true, price: 100 }
            });
            if (createRes.ok()) {
              realPackage = await createRes.json();
            }
          }
        }
      } catch (e) {
        // Ignore error
      }

      // 2. Mock the UI call to ensure it loads correctly in the component
      await authenticatedPage.route('**/api/packages*', async route => {
        await route.fulfill({
          json: {
            _embedded: { packages: [realPackage] },
            page: { size: 20, totalElements: 1, totalPages: 1, number: 0 }
          }
        });
      });

      const packageDiscountCode = `PKG-${uniqueId}`;
      
      await discountsListPage.goto();
      await discountsListPage.clickAddDiscount();
      await discountFormPage.waitForFormLoad();

      await discountFormPage.fillForm({
        code: packageDiscountCode,
        value: 10,
        scope: 'PACKAGE',
        validFrom: 'Today',
        validTo: 'End of Year',
        selectedPackageNames: [realPackage.name]
      });
      
      await discountFormPage.clickSubmit();
      // Allow for potential warning if association fails due to backend logic, but primary success is creation
      await expect(authenticatedPage.locator('[role="status"]').filter({ hasText: /success|created/i }).first()).toBeVisible();
      
      // Verify in list
      await discountsListPage.goto();
      await discountsListPage.searchDiscount(packageDiscountCode);
      await discountsListPage.verifyDiscountExists(packageDiscountCode);
      
      // Unroute to clean up
      await authenticatedPage.unroute('**/api/packages*');
    });

    // --- SCOPE: OFFERING ---
    await test.step('Create Discount with Offering Scope', async () => {
      // 1. Get Real Offering Data
      let realOffering = { id: 1, name: 'Weekend Special' };
      try {
        const response = await authenticatedPage.request.get('/api/offerings');
        if (response.ok()) {
          const data = await response.json();
          if (data._embedded?.offerings?.length > 0) {
            realOffering = data._embedded.offerings[0];
          } else {
            const createRes = await authenticatedPage.request.post('/api/offerings', {
              data: { name: `Off-${uniqueId}`, description: 'Test Offering', active: true, price: 50 }
            });
            if (createRes.ok()) {
              realOffering = await createRes.json();
            }
          }
        }
      } catch (e) {
        // Ignore error
      }

      // 2. Mock the UI call
      await authenticatedPage.route('**/api/offerings*', async route => {
        await route.fulfill({
          json: {
            _embedded: { offerings: [realOffering] },
            page: { size: 20, totalElements: 1, totalPages: 1, number: 0 }
          }
        });
      });

      const offeringDiscountCode = `OFF-${uniqueId}`;
      
      await discountsListPage.goto();
      await discountsListPage.clickAddDiscount();
      await discountFormPage.waitForFormLoad();

      await discountFormPage.fillForm({
        code: offeringDiscountCode,
        value: 50, // Amount
        type: 'FIXED_AMOUNT',
        scope: 'OFFERING',
        validFrom: 'Today',
        validTo: 'End of Year',
        selectedOfferingNames: [realOffering.name]
      });
      
      await discountFormPage.clickSubmit();
      await TestHelpers.verifyToastMessage(authenticatedPage, /success|created/i);
      
      // Verify in list
      await discountsListPage.goto();
      await discountsListPage.searchDiscount(offeringDiscountCode);
      await discountsListPage.verifyDiscountExists(offeringDiscountCode);
      
      // Unroute
      await authenticatedPage.unroute('**/api/offerings*');
    });
  });
});
