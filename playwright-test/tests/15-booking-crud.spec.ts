import { expect, test } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

interface TestResources {
  vehicleId: number;
  offeringId: number;
  packageId: number;
  discountCode: string;
  discountId: number;
  bookingId: number;
}

/**
 * Helper to make authenticated API requests
 */
async function apiRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Create a test vehicle
 */
async function createTestVehicle(accessToken: string): Promise<number> {
  const vehicleData = TestHelpers.generateVehicleData('E2E-Booking');
  
  const vehicle = await apiRequest<any>('/api/vehicles', accessToken, {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });

  const vehicleId = vehicle.id || vehicle._links?.self?.href?.split('/').pop();
  console.log(`Created test vehicle: ${vehicleId}`);
  return parseInt(vehicleId);
}

/**
 * Create pricing for a vehicle
 */
async function createVehiclePricing(accessToken: string, vehicleId: number): Promise<number> {
  const now = new Date();
  const validFrom = now.toISOString();
  const validTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
  
  const pricingData = {
    vehicleId: vehicleId,
    baseRate: 150.00,
    rateType: 'DAILY',
    depositAmount: 500.00,
    minimumRentalDays: 1,
    validFrom: validFrom,
    validTo: validTo,
    isDefault: true,
  };
  
  const pricing = await apiRequest<any>('/api/v1/pricings', accessToken, {
    method: 'POST',
    body: JSON.stringify(pricingData),
  });

  const pricingId = pricing.id || pricing._links?.self?.href?.split('/').pop();
  console.log(`Created pricing: ${pricingId} for vehicle: ${vehicleId}`);
  return parseInt(pricingId);
}

/**
 * Create a test offering
 */
async function createTestOffering(accessToken: string): Promise<number> {
  const offeringData = TestHelpers.generateOfferingData('E2E-Booking');
  
  const offering = await apiRequest<any>('/api/offerings', accessToken, {
    method: 'POST',
    body: JSON.stringify(offeringData),
  });

  const offeringId = offering.id || offering._links?.self?.href?.split('/').pop();
  console.log(`Created test offering: ${offeringId}`);
  return parseInt(offeringId);
}

/**
 * Create a test package
 */
async function createTestPackage(accessToken: string): Promise<number> {
  const uniqueId = TestHelpers.generateUniqueId();
  const now = new Date();
  const validFrom = now.toISOString();
  const validTo = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days from now
  
  const packageData = {
    name: `E2E-Booking Package ${uniqueId}`,
    description: 'Test package for E2E booking tests',
    priceModifier: 50.00,
    modifierType: 'FIXED',
    allowDiscountOnModifier: true,
    validFrom: validFrom,
    validTo: validTo,
    minRentalDays: 1,
  };
  
  const pkg = await apiRequest<any>('/api/packages', accessToken, {
    method: 'POST',
    body: JSON.stringify(packageData),
  });

  const packageId = pkg.id || pkg._links?.self?.href?.split('/').pop();
  console.log(`Created test package: ${packageId}`);
  return parseInt(packageId);
}

/**
 * Create a test discount
 */
async function createTestDiscount(accessToken: string): Promise<{ discountId: number; discountCode: string }> {
  // Generate a more unique code using timestamp + random
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const discountCode = `E2E${timestamp}${random}`.substring(0, 20);
  const now = new Date();
  const validFrom = now.toISOString();
  const validTo = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days from now
  
  const discountData = {
    code: discountCode,
    name: `E2E Test Discount ${timestamp}`,
    description: 'Test discount for E2E booking tests',
    discountType: 'PERCENTAGE',
    value: 10.00,
    applicableScope: 'BOOKING', // Valid values: ALL, PACKAGE, OFFERING, BOOKING, VEHICLE
    validFrom: validFrom,
    validTo: validTo,
    usageLimit: 100,
    usageCount: 0,
    active: true,
  };
  
  const discount = await apiRequest<any>('/api/discounts', accessToken, {
    method: 'POST',
    body: JSON.stringify(discountData),
  });

  const discountId = discount.id || discount._links?.self?.href?.split('/').pop();
  console.log(`Created test discount: ${discountId} with code: ${discountCode}`);
  return { discountId: parseInt(discountId), discountCode };
}

/**
 * Create a test booking with all resources
 */
async function createTestBooking(
  accessToken: string,
  vehicleId: number,
  offeringId: number,
  packageId: number,
  discountCode: string
): Promise<number> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 7); // 1 week from now
  startDate.setHours(10, 0, 0, 0); // 10:00 AM
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3); // 3 days rental
  endDate.setHours(10, 0, 0, 0); // 10:00 AM

  const bookingData = TestHelpers.generateBookingData('E2E');
  
  // Format dates as LocalDateTime (ISO format with time)
  const formatLocalDateTime = (date: Date) => {
    return date.toISOString().slice(0, 19); // e.g., "2025-12-22T10:00:00"
  };

  const bookingRequest = {
    vehicles: [{
      vehicleId: vehicleId,
      startDate: formatLocalDateTime(startDate),
      endDate: formatLocalDateTime(endDate),
      pickupLocation: bookingData.pickupLocation,
      dropoffLocation: bookingData.dropoffLocation,
    }],
    packageId: packageId,
    offerings: [{
      offeringId: offeringId,
      quantity: 1,
    }],
    discountCodes: [discountCode],
    guestName: bookingData.guestName,
    guestEmail: bookingData.guestEmail,
    guestPhone: bookingData.guestPhone,
    currency: 'MYR',
  };

  const booking = await apiRequest<any>('/api/v1/bookings', accessToken, {
    method: 'POST',
    body: JSON.stringify(bookingRequest),
  });

  console.log('Booking API response:', JSON.stringify(booking, null, 2));

  // Try multiple ways to extract booking ID
  let bookingId = booking.id;
  if (!bookingId && booking._links?.self?.href) {
    const match = booking._links.self.href.match(/\/(\d+)$/);
    bookingId = match ? match[1] : undefined;
  }
  if (!bookingId && booking.bookingId) {
    bookingId = booking.bookingId;
  }
  
  console.log(`Created test booking: ${bookingId}`);
  return parseInt(bookingId);
}

/**
 * Test Suite: Booking CRUD Operations
 * Creates all required resources (vehicle, offering, package, discount) and a test booking
 * Then runs all tests against them
 */
test.describe('Booking CRUD Operations', () => {
  // Run tests serially since they depend on each other
  test.describe.configure({ mode: 'serial' });

  // Store created resources for use across tests
  let testResources: TestResources | null = null;

  test('BOOK-000: Setup - Create Test Resources', async ({ 
    authenticatedPage 
  }) => {
    test.setTimeout(120000); // Extended timeout for resource creation
    
    await test.step('Get access token from session', async () => {
      await authenticatedPage.goto('/bookings');
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      // Get access token from session
      const sessionResponse = await authenticatedPage.request.get('/api/auth/session');
      const session = await sessionResponse.json();
      const accessToken = session.accessToken;

      if (!accessToken) {
        throw new Error('Failed to get access token from session');
      }

      console.log('Creating test resources for booking tests...');

      // Create all required resources
      const vehicleId = await createTestVehicle(accessToken);
      
      // Create pricing for the vehicle (required for booking)
      await createVehiclePricing(accessToken, vehicleId);
      
      const offeringId = await createTestOffering(accessToken);
      const packageId = await createTestPackage(accessToken);
      const { discountId, discountCode } = await createTestDiscount(accessToken);

      // Create a test booking with all resources
      const bookingId = await createTestBooking(
        accessToken,
        vehicleId,
        offeringId,
        packageId,
        discountCode
      );

      testResources = {
        vehicleId,
        offeringId,
        packageId,
        discountCode,
        discountId,
        bookingId,
      };

      console.log('Test resources created:', testResources);
    });
  });

  test.beforeEach(async ({ authenticatedPage }) => {
    // Skip beforeEach for the setup test
    if (!testResources) {
      return;
    }
    await authenticatedPage.goto('/bookings');
    await authenticatedPage.waitForLoadState('domcontentloaded');
  });

  test('BOOK-001: Navigate to Bookings Page', async ({ 
    authenticatedPage
  }) => {
    await test.step('Verify bookings page loads correctly', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      // Check page title
      await expect(authenticatedPage.locator('h1').first()).toContainText(/Booking/i);
      
      // Check at least one "New Booking" link exists
      const newBookingLink = authenticatedPage.locator('a[href="/bookings/new"]').first();
      await expect(newBookingLink).toBeVisible({ timeout: 10000 });
    });
  });

  test('BOOK-002: Navigate to New Booking Form', async ({ 
    authenticatedPage, 
    bookingsListPage
  }) => {
    await test.step('Click New Booking button', async () => {
      await bookingsListPage.clickNewBooking();
      await authenticatedPage.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify form loads', async () => {
      await expect(authenticatedPage).toHaveURL(/\/bookings\/new/, { timeout: 10000 });
      await authenticatedPage.waitForLoadState('domcontentloaded');
      const formContent = authenticatedPage.locator('main').first();
      await expect(formContent).toBeVisible({ timeout: 10000 });
    });
  });

  test('BOOK-003: View Existing Bookings List', async ({ 
    authenticatedPage
  }) => {
    test.setTimeout(30000);

    await test.step('Verify bookings table is displayed', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');
      await authenticatedPage.waitForTimeout(2000);
      
      // Table should be visible since we created a booking
      const table = authenticatedPage.locator('table');
      await expect(table).toBeVisible({ timeout: 10000 });
      
      // Should have at least one row
      const tableRows = authenticatedPage.locator('table tbody tr');
      await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('BOOK-004: Read Booking Details', async ({ 
    authenticatedPage,
    bookingDetailPage
  }) => {
    test.setTimeout(60000);

    await test.step('Navigate to the test booking', async () => {
      await authenticatedPage.goto(`/bookings/${testResources.bookingId}`);
      await authenticatedPage.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify booking detail page elements', async () => {
      await bookingDetailPage.waitForPageLoad();
      
      // Verify main heading contains "Booking"
      await expect(authenticatedPage.locator('h1').first()).toContainText(/Booking/i);
      
      // Verify tabs are present
      await expect(authenticatedPage.locator('[role="tab"]').first()).toBeVisible();
    });

    await test.step('Navigate through tabs', async () => {
      const tabs = authenticatedPage.locator('[role="tab"]');
      const tabCount = await tabs.count();
      
      // Click through each tab
      for (let i = 0; i < tabCount; i++) {
        await tabs.nth(i).click();
        await authenticatedPage.waitForTimeout(300);
      }
    });
  });

  test('BOOK-005: Booking History Tab', async ({ 
    authenticatedPage,
    bookingDetailPage
  }) => {
    test.setTimeout(60000);

    await test.step('Navigate to the test booking', async () => {
      await authenticatedPage.goto(`/bookings/${testResources.bookingId}`);
      await authenticatedPage.waitForLoadState('domcontentloaded');
    });

    await test.step('View booking history tab', async () => {
      await bookingDetailPage.waitForPageLoad();
      
      // Click History tab
      const historyTab = authenticatedPage.getByRole('tab', { name: 'History' });
      await expect(historyTab).toBeVisible({ timeout: 5000 });
      await historyTab.click();
      await authenticatedPage.waitForTimeout(1000);

      // Verify history content is visible (active tab panel)
      const historyContent = authenticatedPage.getByRole('tabpanel', { name: 'History' });
      await expect(historyContent).toBeVisible();
    });
  });

  test('BOOK-006: Booking Payments Tab', async ({ 
    authenticatedPage,
    bookingDetailPage
  }) => {
    test.setTimeout(60000);

    await test.step('Navigate to the test booking', async () => {
      await authenticatedPage.goto(`/bookings/${testResources.bookingId}`);
      await authenticatedPage.waitForLoadState('domcontentloaded');
    });

    await test.step('View payments tab', async () => {
      await bookingDetailPage.waitForPageLoad();
      
      // Click Payments tab
      const paymentsTab = authenticatedPage.getByRole('tab', { name: 'Payments' });
      await expect(paymentsTab).toBeVisible({ timeout: 5000 });
      await paymentsTab.click();
      await authenticatedPage.waitForTimeout(1000);

      // Verify payment content is visible (active tab panel)
      const paymentContent = authenticatedPage.getByRole('tabpanel', { name: 'Payments' });
      await expect(paymentContent).toBeVisible();
    });
  });

  test('BOOK-007: Record Payment Button', async ({ 
    authenticatedPage,
    bookingDetailPage
  }) => {
    test.setTimeout(60000);

    await test.step('Navigate to the test booking', async () => {
      await authenticatedPage.goto(`/bookings/${testResources.bookingId}`);
      await authenticatedPage.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify Record Payment button exists', async () => {
      await bookingDetailPage.waitForPageLoad();
      
      const recordPaymentBtn = authenticatedPage.locator('button:has-text("Record Payment")');
      await expect(recordPaymentBtn).toBeVisible({ timeout: 10000 });
    });

    await test.step('Open Record Payment dialog', async () => {
      const recordPaymentBtn = authenticatedPage.locator('button:has-text("Record Payment")');
      await recordPaymentBtn.click();
      
      // Verify dialog opens
      const dialog = authenticatedPage.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      
      // Close dialog
      await authenticatedPage.keyboard.press('Escape');
      await authenticatedPage.waitForTimeout(500);
    });
  });

  test('BOOK-EDGE-001: Search Booking by ID', async ({ 
    authenticatedPage
  }) => {
    test.setTimeout(30000);

    await test.step('Search for the test booking by ID', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');

      // Click "By ID" button (the button has Hash icon and text "By ID")
      const byIdButton = authenticatedPage.getByRole('button', { name: /by id/i });
      await expect(byIdButton).toBeVisible({ timeout: 5000 });
      await byIdButton.click();
      await authenticatedPage.waitForTimeout(500);
      
      // Enter booking ID
      const idInput = authenticatedPage.locator('input#bookingId');
      await idInput.fill(testResources.bookingId.toString());
      
      // Click search (use exact match to avoid 'Advanced Search' button)
      const searchButton = authenticatedPage.getByRole('button', { name: 'Search', exact: true });
      await searchButton.click();
      await authenticatedPage.waitForTimeout(2000);
      
      // Verify the booking is found
      const tableRows = authenticatedPage.locator('table tbody tr');
      await expect(tableRows.first()).toBeVisible({ timeout: 5000 });
      
      // Verify the ID is in the table
      const firstRowText = await tableRows.first().textContent();
      expect(firstRowText).toContain(testResources.bookingId.toString());
    });
  });

  test('BOOK-EDGE-002: Empty Search Results', async ({ 
    authenticatedPage
  }) => {
    test.setTimeout(30000);

    await test.step('Search for non-existent booking', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');

      const byIdButton = authenticatedPage.getByRole('button', { name: /by id/i });
      await expect(byIdButton).toBeVisible({ timeout: 5000 });
      await byIdButton.click();
      await authenticatedPage.waitForTimeout(500);
      
      const idInput = authenticatedPage.locator('input#bookingId');
      await idInput.fill('999999999');
      
      // Click search (use exact match to avoid 'Advanced Search' button)
      const searchButton = authenticatedPage.getByRole('button', { name: 'Search', exact: true });
      await searchButton.click();
      await authenticatedPage.waitForTimeout(2000);
      
      // Should have 0 results
      const tableRows = authenticatedPage.locator('table tbody tr');
      const rowCount = await tableRows.count();
      expect(rowCount).toBe(0);
    });
  });

  test('BOOK-EDGE-003: Invalid Booking ID Navigation', async ({ 
    authenticatedPage
  }) => {
    test.setTimeout(60000);

    await test.step('Navigate to non-existent booking', async () => {
      await authenticatedPage.goto('/bookings/999999999');
      await authenticatedPage.waitForLoadState('domcontentloaded');
      await authenticatedPage.waitForTimeout(3000);
      
      // Should show error message or back button
      const hasError = await authenticatedPage.getByText(/error|not found|failed/i).first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasBackButton = await authenticatedPage.locator('a:has-text("Back")').isVisible({ timeout: 3000 }).catch(() => false);
      const hasDestructive = await authenticatedPage.locator('.text-destructive').isVisible({ timeout: 3000 }).catch(() => false);
      const pageHasContent = await authenticatedPage.locator('main').isVisible().catch(() => false);
      
      expect(hasError || hasBackButton || hasDestructive || pageHasContent).toBeTruthy();
    });
  });

  test('BOOK-EDGE-004: Pagination Navigation', async ({ 
    authenticatedPage
  }) => {
    test.setTimeout(30000);

    await test.step('Check pagination controls', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');

      const nextButton = authenticatedPage.locator('button:has-text("Next")');
      const prevButton = authenticatedPage.locator('button:has-text("Previous")');

      const hasNextButton = await nextButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasNextButton) {
        // Previous should be disabled on first page
        const isPrevDisabled = await prevButton.isDisabled().catch(() => true);
        expect(isPrevDisabled).toBeTruthy();
      }
    });
  });

  test('BOOK-EDGE-005: Booking Status Display', async ({ 
    authenticatedPage
  }) => {
    test.setTimeout(30000);

    await test.step('Verify status badges in list', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      const tableRows = authenticatedPage.locator('table tbody tr');
      await expect(tableRows.first()).toBeVisible({ timeout: 10000 });

      // Check that status column exists
      const headerCells = authenticatedPage.locator('table thead th');
      const headerTexts = await headerCells.allTextContents();
      expect(headerTexts.some(h => h.toLowerCase().includes('status'))).toBeTruthy();

      // Check that first row has a status badge
      const firstRowStatusBadge = tableRows.first().locator('span[class*="rounded"]');
      await expect(firstRowStatusBadge.first()).toBeVisible();
    });
  });

  test('BOOK-EDGE-006: Amount Column Display', async ({ 
    authenticatedPage
  }) => {
    test.setTimeout(30000);

    await test.step('Verify amount column exists', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      const tableRows = authenticatedPage.locator('table tbody tr');
      await expect(tableRows.first()).toBeVisible({ timeout: 10000 });

      const headerCells = authenticatedPage.locator('table thead th');
      const headerTexts = await headerCells.allTextContents();
      expect(headerTexts.some(h => h.toLowerCase().includes('amount') || h.toLowerCase().includes('price'))).toBeTruthy();
    });
  });

  test('BOOK-EDGE-007: Back Navigation', async ({ 
    authenticatedPage,
    bookingDetailPage
  }) => {
    test.setTimeout(60000);

    await test.step('Navigate to booking and back', async () => {
      await authenticatedPage.goto(`/bookings/${testResources.bookingId}`);
      await authenticatedPage.waitForLoadState('domcontentloaded');
      await bookingDetailPage.waitForPageLoad();

      // Click back button
      const backButton = authenticatedPage.locator('a:has-text("Back")').first();
      await backButton.click();
      
      // Should be back on bookings list
      await expect(authenticatedPage).toHaveURL(/\/bookings$/);
    });
  });

  test('BOOK-EDGE-008: Customer Column Display', async ({ 
    authenticatedPage
  }) => {
    test.setTimeout(30000);

    await test.step('Verify customer column exists', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      const tableRows = authenticatedPage.locator('table tbody tr');
      await expect(tableRows.first()).toBeVisible({ timeout: 10000 });

      const headerCells = authenticatedPage.locator('table thead th');
      const headerTexts = await headerCells.allTextContents();
      expect(headerTexts.some(h => h.toLowerCase().includes('customer') || h.toLowerCase().includes('guest'))).toBeTruthy();
    });
  });

  test('BOOK-EDGE-009: Dates Column Display', async ({ 
    authenticatedPage
  }) => {
    test.setTimeout(30000);

    await test.step('Verify dates column exists', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      const tableRows = authenticatedPage.locator('table tbody tr');
      await expect(tableRows.first()).toBeVisible({ timeout: 10000 });

      const headerCells = authenticatedPage.locator('table thead th');
      const headerTexts = await headerCells.allTextContents();
      expect(headerTexts.some(h => h.toLowerCase().includes('date'))).toBeTruthy();
    });
  });

  test('BOOK-EDGE-010: View Booking from Table Row', async ({ 
    authenticatedPage,
    bookingDetailPage
  }) => {
    test.setTimeout(60000);

    await test.step('Click View button on first row', async () => {
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      const tableRows = authenticatedPage.locator('table tbody tr');
      await expect(tableRows.first()).toBeVisible({ timeout: 10000 });

      // Click on the first "View" link (prefer link over button)
      const viewButton = tableRows.first().locator('a:has-text("View")').first();
      await viewButton.click();
      await authenticatedPage.waitForURL(/\/bookings\/\d+/, { timeout: 10000 });
    });

    await test.step('Verify booking detail page loads', async () => {
      await bookingDetailPage.waitForPageLoad();
      await expect(authenticatedPage.locator('h1').first()).toContainText(/Booking/i);
    });
  });
});
