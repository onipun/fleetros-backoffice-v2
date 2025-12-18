/**
 * Customer Spending Summary API Client
 * 
 * Enterprise-grade API client for customer spending summary operations following SOLID principles:
 * - Single Responsibility: Handles only customer spending summary API calls
 * - Open/Closed: Extensible for new search criteria
 * - Interface Segregation: Clean, focused API
 * 
 * Based on CUSTOMER_SPENDING_SUMMARY_INTEGRATION.md specification
 */

import type { HATEOASCollection } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

/**
 * Customer Spending Summary entity interface
 */
export interface CustomerSpendingSummary {
  id: number;
  customerId?: number;
  totalSpendLifetime: number;
  totalBalancePayment: number;
  totalPaid: number;
  totalRefunded: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  activeBookings: number;
  averageBookingValue: number;
  firstBookingDate?: string;
  lastActivityDate?: string;
  lastSyncDate?: string;
  currency: string;
  // Customer details (if populated)
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  _links?: {
    self?: { href: string };
    customer?: { href: string };
  };
}

/**
 * Search parameters interface
 */
export interface CustomerSpendingSearchParams {
  // Pagination
  page?: number;
  size?: number;
  sort?: string;
  
  // Search criteria
  customerId?: number;
  email?: string;
  nameOrEmail?: string;
  minSpend?: number;
  // Filter modes
  pendingBalance?: boolean;
  activeBookings?: boolean;
  topSpenders?: boolean;
}

/**
 * Search mode type
 */
export type SpendingSearchMode = 
  | 'all' 
  | 'customerId' 
  | 'email' 
  | 'nameOrEmail' 
  | 'minSpend' 
  | 'pendingBalance' 
  | 'activeBookings' 
  | 'topSpenders';

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
  throw new Error('An unknown error occurred during customer spending search');
}

/**
 * Build query string from search parameters
 */
function buildQueryString(params: CustomerSpendingSearchParams): string {
  const queryParams = new URLSearchParams();
  
  // Add pagination params
  if (params.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params.size !== undefined) {
    queryParams.append('size', params.size.toString());
  }
  if (params.sort) {
    queryParams.append('sort', params.sort);
  }
  
  // Add search-specific params based on endpoint
  if (params.customerId !== undefined) {
    queryParams.append('customerId', params.customerId.toString());
  }
  if (params.email) {
    queryParams.append('email', params.email);
  }
  if (params.nameOrEmail) {
    queryParams.append('query', params.nameOrEmail);
  }
  if (params.minSpend !== undefined) {
    queryParams.append('minSpend', params.minSpend.toString());
  }
  
  return queryParams.toString();
}

/**
 * Determine the appropriate search endpoint based on parameters
 */
function getSearchEndpoint(params: CustomerSpendingSearchParams): string {
  const { customerId, email, nameOrEmail, minSpend, pendingBalance, activeBookings, topSpenders } = params;
  
  // Priority 1: Search by customer ID
  if (customerId !== undefined) {
    return '/api/customer-spending-summaries/search/findByCustomerId';
  }
  
  // Priority 2: Search by customer email
  if (email) {
    return '/api/customer-spending-summaries/search/findByCustomerEmail';
  }
  
  // Priority 3: Search by name or email (partial match)
  if (nameOrEmail) {
    return '/api/customer-spending-summaries/search/searchByNameOrEmail';
  }
  
  // Priority 4: Find by minimum total spend
  if (minSpend !== undefined) {
    return '/api/customer-spending-summaries/search/findByMinTotalSpend';
  }
  
  // Priority 5: Find customers with pending balance
  if (pendingBalance) {
    return '/api/customer-spending-summaries/search/findByBalancePaymentPending';
  }
  
  // Priority 6: Find customers with active bookings
  if (activeBookings) {
    return '/api/customer-spending-summaries/search/findByActiveBookings';
  }
  
  // Priority 7: Find top spenders
  if (topSpenders) {
    return '/api/customer-spending-summaries/search/findTopSpenders';
  }
  
  // Default to listing all spending summaries
  return '/api/customer-spending-summaries';
}

/**
 * Search customer spending summaries with flexible criteria
 * 
 * @param params - Search parameters
 * @returns Paginated spending summary results
 * 
 * @example
 * // Search by customer email
 * const results = await searchCustomerSpending({ email: 'john@example.com' });
 * 
 * @example
 * // Find top 10 spenders
 * const results = await searchCustomerSpending({ topSpenders: true, size: 10 });
 */
export async function searchCustomerSpending(
  params: CustomerSpendingSearchParams = {}
): Promise<HATEOASCollection<CustomerSpendingSummary>> {
  try {
    const endpoint = getSearchEndpoint(params);
    const queryString = buildQueryString(params);
    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const headers = await createHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - session expired
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=session_expired';
        }
        throw new Error('Unauthorized - please login again');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Search failed with status ${response.status}`
      );
    }

    const data = await response.json();
    
    // Handle single result (e.g., findByCustomerId returns single entity)
    if (data && !data._embedded && data.id !== undefined) {
      return {
        _embedded: {
          customerSpendingSummaries: [data]
        },
        _links: {
          self: { href: url }
        },
        page: {
          size: 1,
          totalElements: 1,
          totalPages: 1,
          number: 0
        }
      };
    }

    return data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get a single customer spending summary by ID
 */
export async function getCustomerSpendingById(
  id: number
): Promise<CustomerSpendingSummary | null> {
  try {
    const url = `${API_BASE_URL}/api/customer-spending-summaries/${id}`;
    const headers = await createHeaders();
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch spending summary: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching spending summary:', error);
    throw error;
  }
}

/**
 * Search by customer ID
 */
export async function searchByCustomerId(
  customerId: number,
  page: number = 0,
  size: number = 20
): Promise<HATEOASCollection<CustomerSpendingSummary>> {
  return searchCustomerSpending({ customerId, page, size });
}

/**
 * Search by customer email
 */
export async function searchByEmail(
  email: string,
  page: number = 0,
  size: number = 20
): Promise<HATEOASCollection<CustomerSpendingSummary>> {
  return searchCustomerSpending({ email, page, size });
}

/**
 * Search by name or email (partial match)
 */
export async function searchByNameOrEmail(
  query: string,
  page: number = 0,
  size: number = 20
): Promise<HATEOASCollection<CustomerSpendingSummary>> {
  return searchCustomerSpending({ nameOrEmail: query, page, size });
}

/**
 * Find customers with minimum total spend
 */
export async function searchByMinSpend(
  minSpend: number,
  page: number = 0,
  size: number = 20,
  sort: string = 'totalSpendLifetime,desc'
): Promise<HATEOASCollection<CustomerSpendingSummary>> {
  return searchCustomerSpending({ minSpend, page, size, sort });
}

/**
 * Find customers with pending balance payments
 */
export async function searchPendingBalance(
  page: number = 0,
  size: number = 20
): Promise<HATEOASCollection<CustomerSpendingSummary>> {
  return searchCustomerSpending({ pendingBalance: true, page, size, sort: 'totalBalancePayment,desc' });
}

/**
 * Find customers with active bookings
 */
export async function searchActiveBookings(
  page: number = 0,
  size: number = 20
): Promise<HATEOASCollection<CustomerSpendingSummary>> {
  return searchCustomerSpending({ activeBookings: true, page, size });
}

/**
 * Find top spenders
 */
export async function searchTopSpenders(
  limit: number = 10
): Promise<HATEOASCollection<CustomerSpendingSummary>> {
  return searchCustomerSpending({ topSpenders: true, size: limit, sort: 'totalSpendLifetime,desc' });
}
