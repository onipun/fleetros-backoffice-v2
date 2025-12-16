/**
 * Payment Search API Client
 * 
 * Enterprise-grade API client for payment search operations following SOLID principles:
 * - Single Responsibility: Handles only payment search API calls
 * - Open/Closed: Extensible for new search criteria
 * - Interface Segregation: Clean, focused API
 * 
 * Based on PAYMENT_SEARCH_API.md specification
 */

import type { HATEOASCollection, Payment } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

/**
 * Payment search parameters interface
 */
export interface PaymentSearchParams {
  // Pagination
  page?: number;
  size?: number;
  sort?: string;
  
  // Search criteria
  bookingId?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  payerName?: string;
  status?: PaymentStatus;
  currency?: string;
  isManual?: boolean;
  isDeposit?: boolean;
}

export type PaymentMethod = 
  | 'CREDIT_CARD' 
  | 'DEBIT_CARD' 
  | 'PAYPAL' 
  | 'BANK_TRANSFER' 
  | 'CASH' 
  | 'OTHER';

export type PaymentStatus = 
  | 'PENDING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'REFUNDED';

/**
 * Get access token from session API
 */
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

/**
 * Create headers with authentication
 */
async function createHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = await getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Handle API errors consistently
 */
function handleApiError(error: unknown): never {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('An unknown error occurred during payment search');
}

/**
 * Build query string from search parameters
 */
function buildQueryString(params: PaymentSearchParams): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  return queryParams.toString();
}

/**
 * Search payments with flexible criteria
 * 
 * @param params - Search parameters
 * @returns Paginated payment results
 * 
 * @example
 * // Search by booking ID
 * const results = await searchPayments({ bookingId: 123, page: 0, size: 20 });
 * 
 * @example
 * // Search by date range and status
 * const results = await searchPayments({
 *   paymentDateFrom: '2025-01-15T00:00:00',
 *   paymentDateTo: '2025-01-30T23:59:59',
 *   status: 'COMPLETED',
 *   page: 0,
 *   size: 50
 * });
 */
export async function searchPayments(
  params: PaymentSearchParams = {}
): Promise<HATEOASCollection<Payment>> {
  try {
    const queryString = buildQueryString(params);
    const url = `${API_BASE_URL}/api/v1/payments/search${queryString ? `?${queryString}` : ''}`;
    
    const headers = await createHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Payment search failed with status ${response.status}`
      );
    }
    
    const data = await response.json();
    
    // Transform Spring Data REST format to HATEOAS collection format if needed
    if (data.content && !data._embedded) {
      return {
        _embedded: {
          payments: data.content,
        },
        _links: data._links || {},
        page: {
          size: data.size || params.size || 20,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
          number: data.number || params.page || 0,
        },
      };
    }
    
    return data;
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * Get a single payment by ID
 */
export async function getPaymentById(paymentId: number): Promise<Payment> {
  try {
    const url = `${API_BASE_URL}/api/v1/payments/${paymentId}`;
    const headers = await createHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Failed to get payment with status ${response.status}`
      );
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error);
  }
}
