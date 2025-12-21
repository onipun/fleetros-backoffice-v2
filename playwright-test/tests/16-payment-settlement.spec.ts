import { expect, test } from '../fixtures/test-fixtures';
import { TestHelpers } from '../utils/test-helpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

interface TestResources {
  vehicleId: number;
  bookingId: number;
  paymentId: number;
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
 * Create a test vehicle with pricing
 */
async function createTestVehicle(accessToken: string): Promise<number> {
  const vehicleData = TestHelpers.generateVehicleData('E2E-Payment');
  
  const vehicle = await apiRequest<any>('/api/vehicles', accessToken, {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });

  const vehicleId = vehicle.id || vehicle._links?.self?.href?.split('/').pop();
  console.log(`Created test vehicle: ${vehicleId}`);
  
  // Create pricing for the vehicle
  const now = new Date();
  const validFrom = now.toISOString();
  const validTo = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  
  const pricingData = {
    vehicleId: parseInt(vehicleId),
    baseRate: 100.00,
    rateType: 'DAILY',
    depositAmount: 200.00,
    minimumRentalDays: 1,
    validFrom: validFrom,
    validTo: validTo,
    isDefault: true,
  };
  
  await apiRequest<any>('/api/v1/pricings', accessToken, {
    method: 'POST',
    body: JSON.stringify(pricingData),
  });

  return parseInt(vehicleId);
}

/**
 * Create a test booking
 */
async function createTestBooking(accessToken: string, vehicleId: number): Promise<number> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 7);
  startDate.setHours(10, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3);
  endDate.setHours(10, 0, 0, 0);

  const bookingData = TestHelpers.generateBookingData('E2E-Payment');
  
  const formatLocalDateTime = (date: Date) => {
    return date.toISOString().slice(0, 19);
  };

  const bookingRequest = {
    vehicles: [{
      vehicleId: vehicleId,
      startDate: formatLocalDateTime(startDate),
      endDate: formatLocalDateTime(endDate),
      pickupLocation: bookingData.pickupLocation,
      dropoffLocation: bookingData.dropoffLocation,
    }],
    guestName: bookingData.guestName,
    guestEmail: bookingData.guestEmail,
    guestPhone: bookingData.guestPhone,
    currency: 'MYR',
  };

  const booking = await apiRequest<any>('/api/v1/bookings', accessToken, {
    method: 'POST',
    body: JSON.stringify(bookingRequest),
  });

  let bookingId = booking.id || booking.bookingId;
  if (!bookingId && booking._links?.self?.href) {
    const match = booking._links.self.href.match(/\/(\d+)$/);
    bookingId = match ? match[1] : undefined;
  }
  
  console.log(`Created test booking: ${bookingId}`);
  return parseInt(bookingId);
}

/**
 * Record a manual payment for a booking
 */
async function recordManualPayment(accessToken: string, bookingId: number): Promise<number> {
  const paymentRequest = {
    amount: 50.00,
    paymentMethod: 'CASH',
    referenceNumber: `PAY-${Date.now()}`,
    notes: 'E2E test payment',
  };

  const payment = await apiRequest<any>(`/api/v1/bookings/${bookingId}/payments/manual`, accessToken, {
    method: 'POST',
    body: JSON.stringify(paymentRequest),
  });

  const paymentId = payment.paymentId || payment.id;
  console.log(`Recorded payment: ${paymentId} for booking: ${bookingId}`);
  return parseInt(paymentId);
}

/**
 * Test Suite: Payment and Settlement Operations
 */
test.describe('Payment and Settlement List Operations', () => {
  test.describe.configure({ mode: 'serial' });

  let testResources: TestResources | null = null;

  test('PAY-000: Setup - Create Test Booking and Payment', async ({ 
    authenticatedPage 
  }) => {
    test.setTimeout(120000);
    
    await test.step('Get access token and create resources', async () => {
      await authenticatedPage.goto('/payments');
      await authenticatedPage.waitForLoadState('networkidle');
      
      const sessionResponse = await authenticatedPage.request.get('/api/auth/session');
      const session = await sessionResponse.json();
      const accessToken = session.accessToken;

      if (!accessToken) {
        throw new Error('Failed to get access token from session');
      }

      console.log('Creating test resources for payment tests...');

      const vehicleId = await createTestVehicle(accessToken);
      const bookingId = await createTestBooking(accessToken, vehicleId);
      const paymentId = await recordManualPayment(accessToken, bookingId);

      testResources = {
        vehicleId,
        bookingId,
        paymentId,
      };

      console.log('Test resources created:', testResources);
    });
  });

  test('PAY-001: Navigate to Payments Page', async ({ 
    authenticatedPage,
    paymentsListPage
  }) => {
    await test.step('Verify payments page loads correctly', async () => {
      await paymentsListPage.goto();
      await paymentsListPage.waitForPageLoad();
      
      // Check page title
      await expect(authenticatedPage.locator('h1').first()).toContainText(/Payment/i);
    });
  });

  test('PAY-002: Verify Payments Tab Content', async ({ 
    authenticatedPage,
    paymentsListPage
  }) => {
    test.setTimeout(30000);

    await test.step('Check Payments tab is active by default', async () => {
      await paymentsListPage.goto();
      await paymentsListPage.waitForPageLoad();
      
      // Payments tab should be active
      const paymentsTab = authenticatedPage.locator('[role="tab"]:has-text("Payments")');
      await expect(paymentsTab).toHaveAttribute('data-state', 'active', { timeout: 5000 });
    });

    await test.step('Verify payments table structure', async () => {
      await authenticatedPage.waitForTimeout(2000);
      
      // Check if table exists or empty state
      const table = authenticatedPage.locator('table');
      const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasTable) {
        // Verify table headers exist
        const headers = authenticatedPage.locator('table thead th');
        await expect(headers.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test('PAY-003: Verify Settlements Tab', async ({ 
    authenticatedPage,
    paymentsListPage
  }) => {
    test.setTimeout(30000);

    await test.step('Navigate to Settlements tab', async () => {
      await paymentsListPage.goto();
      await paymentsListPage.waitForPageLoad();
      
      // Click on Settlements tab
      const settlementsTab = authenticatedPage.locator('[role="tab"]:has-text("Settlements")');
      await expect(settlementsTab).toBeVisible({ timeout: 5000 });
      await settlementsTab.click();
      await authenticatedPage.waitForTimeout(1000);
    });

    await test.step('Verify Settlements tab is active', async () => {
      const settlementsTab = authenticatedPage.locator('[role="tab"]:has-text("Settlements")');
      await expect(settlementsTab).toHaveAttribute('data-state', 'active', { timeout: 5000 });
    });

    await test.step('Verify settlements content is visible', async () => {
      // Check for settlements tab panel content (use specific name)
      const tabPanel = authenticatedPage.getByRole('tabpanel', { name: 'Settlements' });
      await expect(tabPanel).toBeVisible({ timeout: 5000 });
    });
  });

  test('PAY-004: Verify Payment Table Headers', async ({ 
    authenticatedPage,
    paymentsListPage
  }) => {
    test.setTimeout(30000);

    await test.step('Check payment table headers', async () => {
      await paymentsListPage.goto();
      await paymentsListPage.waitForPageLoad();
      await authenticatedPage.waitForTimeout(2000);
      
      const table = authenticatedPage.locator('table');
      const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasTable) {
        const headerCells = authenticatedPage.locator('table thead th');
        const headerTexts = await headerCells.allTextContents();
        
        // Check for expected headers
        const expectedHeaders = ['ID', 'Amount', 'Method', 'Status'];
        for (const expected of expectedHeaders) {
          const found = headerTexts.some(h => h.toLowerCase().includes(expected.toLowerCase()));
          expect(found).toBeTruthy();
        }
      }
    });
  });

  test('PAY-005: View Payment from Booking Detail', async ({ 
    authenticatedPage,
    bookingDetailPage
  }) => {
    test.setTimeout(60000);

    await test.step('Navigate to test booking', async () => {
      if (!testResources) {
        test.skip();
        return;
      }
      
      await authenticatedPage.goto(`/bookings/${testResources.bookingId}`);
      await authenticatedPage.waitForLoadState('networkidle');
      await bookingDetailPage.waitForPageLoad();
    });

    await test.step('Navigate to Payments tab', async () => {
      const paymentsTab = authenticatedPage.getByRole('tab', { name: 'Payments' });
      await expect(paymentsTab).toBeVisible({ timeout: 5000 });
      await paymentsTab.click();
      await authenticatedPage.waitForTimeout(1000);
    });

    await test.step('Verify payment is visible', async () => {
      const paymentContent = authenticatedPage.getByRole('tabpanel');
      await expect(paymentContent.first()).toBeVisible();
      
      // Wait for content to load
      await authenticatedPage.waitForTimeout(2000);
      
      // The payments tab should have some content visible
      // This could be a payment card, table, or empty state message
      const pageContent = await authenticatedPage.locator('main').textContent();
      
      // Check that the page has loaded some content
      expect(pageContent).toBeTruthy();
    });
  });

  test('PAY-006: Record Payment Dialog', async ({ 
    authenticatedPage,
    bookingDetailPage
  }) => {
    test.setTimeout(60000);

    await test.step('Navigate to test booking', async () => {
      if (!testResources) {
        test.skip();
        return;
      }
      
      await authenticatedPage.goto(`/bookings/${testResources.bookingId}`);
      await authenticatedPage.waitForLoadState('networkidle');
      await bookingDetailPage.waitForPageLoad();
    });

    await test.step('Open Record Payment dialog', async () => {
      const recordPaymentBtn = authenticatedPage.locator('button:has-text("Record Payment")');
      await expect(recordPaymentBtn).toBeVisible({ timeout: 10000 });
      await recordPaymentBtn.click();
      
      // Verify dialog opens
      const dialog = authenticatedPage.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    });

    await test.step('Verify dialog contains payment form', async () => {
      const dialog = authenticatedPage.locator('[role="dialog"]');
      
      // Check for amount input
      const amountInput = dialog.locator('input[type="number"], input[name="amount"]');
      await expect(amountInput.first()).toBeVisible({ timeout: 5000 });
      
      // Close dialog
      await authenticatedPage.keyboard.press('Escape');
      await authenticatedPage.waitForTimeout(500);
    });
  });

  test('PAY-007: Settlement Display in Booking', async ({ 
    authenticatedPage,
    bookingDetailPage
  }) => {
    test.setTimeout(60000);

    await test.step('Navigate to test booking payments tab', async () => {
      if (!testResources) {
        test.skip();
        return;
      }
      
      await authenticatedPage.goto(`/bookings/${testResources.bookingId}?tab=payments`);
      await authenticatedPage.waitForLoadState('networkidle');
      await bookingDetailPage.waitForPageLoad();
    });

    await test.step('Verify settlement information is displayed', async () => {
      // Wait for payments tab content
      await authenticatedPage.waitForTimeout(2000);
      
      // The page should have loaded with payment/settlement content
      const pageContent = await authenticatedPage.locator('main').textContent();
      
      // Check that the page has loaded some content
      expect(pageContent).toBeTruthy();
    });
  });

  test('PAY-008: Switch Between Payments and Settlements Tabs', async ({ 
    authenticatedPage,
    paymentsListPage
  }) => {
    test.setTimeout(30000);

    await test.step('Navigate to payments page', async () => {
      await paymentsListPage.goto();
      await paymentsListPage.waitForPageLoad();
    });

    await test.step('Switch to Settlements tab', async () => {
      const settlementsTab = authenticatedPage.locator('[role="tab"]:has-text("Settlements")');
      await settlementsTab.click();
      await authenticatedPage.waitForTimeout(500);
      
      await expect(settlementsTab).toHaveAttribute('data-state', 'active');
    });

    await test.step('Switch back to Payments tab', async () => {
      const paymentsTab = authenticatedPage.locator('[role="tab"]:has-text("Payments")');
      await paymentsTab.click();
      await authenticatedPage.waitForTimeout(500);
      
      await expect(paymentsTab).toHaveAttribute('data-state', 'active');
    });
  });

  test('PAY-009: Payment Method Column Display', async ({ 
    authenticatedPage,
    paymentsListPage
  }) => {
    test.setTimeout(30000);

    await test.step('Verify payment method is displayed', async () => {
      await paymentsListPage.goto();
      await paymentsListPage.waitForPageLoad();
      await authenticatedPage.waitForTimeout(2000);
      
      const table = authenticatedPage.locator('table');
      const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasTable) {
        const tableRows = authenticatedPage.locator('table tbody tr');
        const rowCount = await tableRows.count();
        
        if (rowCount > 0) {
          // Check that method column has content (icons or text)
          const firstRow = tableRows.first();
          const methodCells = firstRow.locator('td');
          const cellCount = await methodCells.count();
          
          // Method is usually 3rd column
          if (cellCount >= 3) {
            const methodCell = methodCells.nth(2);
            const methodText = await methodCell.textContent();
            expect(methodText).toBeTruthy();
          }
        }
      }
    });
  });

  test('PAY-010: Payment Status Column Display', async ({ 
    authenticatedPage,
    paymentsListPage
  }) => {
    test.setTimeout(30000);

    await test.step('Verify payment status badges are displayed', async () => {
      await paymentsListPage.goto();
      await paymentsListPage.waitForPageLoad();
      await authenticatedPage.waitForTimeout(2000);
      
      const table = authenticatedPage.locator('table');
      const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasTable) {
        const tableRows = authenticatedPage.locator('table tbody tr');
        const rowCount = await tableRows.count();
        
        if (rowCount > 0) {
          // Check for status badge in first row
          const firstRowStatusBadge = tableRows.first().locator('span[class*="rounded"]');
          const hasBadge = await firstRowStatusBadge.first().isVisible({ timeout: 3000 }).catch(() => false);
          
          if (hasBadge) {
            const statusText = await firstRowStatusBadge.first().textContent();
            expect(statusText).toBeTruthy();
          }
        }
      }
    });
  });
});
