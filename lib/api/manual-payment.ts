/**
 * Manual Payment API Service
 * 
 * Handles CRUD operations for manual payments including:
 * - Recording cash, bank transfer, and other offline payments
 * - Uploading payment receipts
 * - Getting payment history and summary
 * - Completing and cancelling payments
 * - Post-completion charges (damage, traffic fines, etc.)
 * 
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

import type { TransactionType } from '@/types/settlement';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

// Payment method options
export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
  { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
  { value: 'PAYMENT_GATEWAY', label: 'Payment Gateway', icon: '🌐' },
  { value: 'QR_PAYMENT', label: 'QR Payment (DuitNow/PayNow)', icon: '📱' },
  { value: 'MOBILE_WALLET', label: 'Mobile Wallet (GrabPay/Touch n Go)', icon: '📲' },
  { value: 'CHECK', label: 'Check/Cheque', icon: '📝' },
  { value: 'LOYALTY_POINTS', label: 'Loyalty Points', icon: '⭐' },
  { value: 'WRITE_OFF', label: 'Write Off', icon: '✏️' },
  { value: 'OTHER', label: 'Other', icon: '💰' },
] as const;

export type PaymentMethodType = typeof PAYMENT_METHODS[number]['value'];

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'CANCELLED'
  | 'DUE_AT_PICKUP';

// Request/Response Types
export interface ManualPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethodType;
  currency?: string;
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
  payerName?: string;
  isDeposit?: boolean;
  /** Transaction type categorization (e.g., ADVANCE_PAYMENT, DAMAGE_CHARGE) */
  transactionType?: TransactionType;
  /** Enable post-completion charges for completed bookings */
  isPostCompletion?: boolean;
  autoConfirmBooking?: boolean;
  confirmBooking?: boolean;
}

export interface PaymentHistoryItem {
  id: number;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  referenceNumber?: string;
  receiptUrl?: string;
  paymentDate?: string;
  isDeposit?: boolean;
  notes?: string;
  /** Transaction type categorization */
  transactionType?: TransactionType;
  /** Whether this is a post-completion transaction */
  isPostCompletion?: boolean;
}

export interface ManualPaymentResponse {
  paymentId: number;
  amount: number;
  paymentMethod: string;
  currency: string;
  status: PaymentStatus;
  referenceNumber?: string;
  receiptUrl?: string;
  paymentDate: string;
  createdAt: string;
  bookingId: number;
  correlationId?: string;
  bookingStatus: string;
  bookingTotal: number;
  totalPaid: number;
  balanceDue: number;
  isFullyPaid: boolean;
  bookingConfirmed: boolean;
  /** Transaction type if specified */
  transactionType?: TransactionType;
  /** Whether this was a post-completion transaction */
  isPostCompletion?: boolean;
  paymentHistory: PaymentHistoryItem[];
  message: string;
}

export interface PaymentSummary {
  bookingId: number;
  correlationId?: string;
  bookingStatus: string;
  bookingTotal: number;
  totalPaid: number;
  balanceDue: number;
  isFullyPaid: boolean;
  paymentHistory: PaymentHistoryItem[];
  message?: string;
}

export interface ReceiptUploadResponse {
  paymentId: number;
  receiptUrl: string;
  message: string;
}

// Helper to get auth token
async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/session');
    if (response.ok) {
      const session = await response.json();
      return session.accessToken || null;
    }
  } catch (error) {
    console.error('Failed to get access token:', error);
  }
  return null;
}

// Helper to make authenticated requests
async function authenticatedFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  
  const headers: Record<string, string> = {};
  
  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge with provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Record a manual payment for a booking
 */
export async function recordManualPayment(
  bookingId: number,
  payment: ManualPaymentRequest
): Promise<ManualPaymentResponse> {
  return authenticatedFetch<ManualPaymentResponse>(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}/payments/manual`,
    {
      method: 'POST',
      body: JSON.stringify(payment),
    }
  );
}

/**
 * Record a manual payment with receipt image
 */
export async function recordManualPaymentWithReceipt(
  bookingId: number,
  payment: ManualPaymentRequest,
  receiptFile: File
): Promise<ManualPaymentResponse> {
  const formData = new FormData();
  formData.append(
    'payment',
    new Blob([JSON.stringify(payment)], { type: 'application/json' })
  );
  formData.append('receipt', receiptFile);

  return authenticatedFetch<ManualPaymentResponse>(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}/payments/manual-with-receipt`,
    {
      method: 'POST',
      body: formData,
    }
  );
}

/**
 * Upload a receipt for an existing payment
 */
export async function uploadPaymentReceipt(
  bookingId: number,
  paymentId: number,
  file: File
): Promise<ReceiptUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return authenticatedFetch<ReceiptUploadResponse>(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}/payments/${paymentId}/receipt`,
    {
      method: 'POST',
      body: formData,
    }
  );
}

/**
 * Get payment history for a booking
 */
export async function getPaymentHistory(
  bookingId: number
): Promise<PaymentHistoryItem[]> {
  return authenticatedFetch<PaymentHistoryItem[]>(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}/payments`,
    { method: 'GET' }
  );
}

/**
 * Get payment summary for a booking
 */
export async function getPaymentSummary(
  bookingId: number
): Promise<PaymentSummary> {
  return authenticatedFetch<PaymentSummary>(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}/payments/summary`,
    { method: 'GET' }
  );
}

/**
 * Mark a payment as completed
 */
export async function completePayment(
  bookingId: number,
  paymentId: number
): Promise<ManualPaymentResponse> {
  return authenticatedFetch<ManualPaymentResponse>(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}/payments/${paymentId}/complete`,
    { method: 'PUT' }
  );
}

/**
 * Cancel a payment
 */
export async function cancelPayment(
  bookingId: number,
  paymentId: number,
  reason?: string
): Promise<ManualPaymentResponse> {
  const url = new URL(`${API_BASE_URL}/api/v1/bookings/${bookingId}/payments/${paymentId}/cancel`);
  if (reason) {
    url.searchParams.set('reason', reason);
  }
  
  return authenticatedFetch<ManualPaymentResponse>(url.toString(), {
    method: 'PUT',
  });
}

/**
 * Get payment method display info
 */
export function getPaymentMethodInfo(method: string) {
  return PAYMENT_METHODS.find(m => m.value === method) || {
    value: method,
    label: method,
    icon: '💰',
  };
}

/**
 * Get status color class for payment status
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'PENDING':
    case 'PROCESSING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'DUE_AT_PICKUP':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}
