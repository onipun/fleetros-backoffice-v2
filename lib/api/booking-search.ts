/**
 * Booking Search API Client
 * 
 * Enterprise-grade API client for booking search operations following SOLID principles:
 * - Single Responsibility: Handles only booking search API calls
 * - Open/Closed: Extensible for new search criteria
 * - Interface Segregation: Clean, focused API
 * 
 * Based on BOOKING_SEARCH_API.md specification
 */

import type { Booking, HATEOASCollection } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

/**
 * Search parameters interface
 */
export interface BookingSearchParams {
  // Pagination
  page?: number;
  size?: number;
  sort?: string;
  
  // Search criteria
  bookingId?: number;
  email?: string;
  phone?: string;
  emailOrPhone?: string;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
}

export type BookingStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

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
  throw new Error('An unknown error occurred during booking search');
}

/**
 * Build query string from search parameters
 * Excludes bookingId from query params as it's used in the URL path
 */
function buildQueryString(params: BookingSearchParams): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    // Skip bookingId as it's part of the URL path, not query params
    if (key === 'bookingId') {
      return;
    }
    
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  return queryParams.toString();
}

/**
 * Determine the appropriate search endpoint based on parameters
 */
function getSearchEndpoint(params: BookingSearchParams): string {
  const { bookingId, email, phone, emailOrPhone, status, startDate, endDate } = params;
  
  // Priority 1: Search by booking ID (single booking lookup)
  if (bookingId !== undefined) {
    return `/api/bookings/${bookingId}`;
  }
  
  // Priority 2: Search by email or phone combined
  if (emailOrPhone) {
    return '/api/bookings/search/findByCustomerEmailOrPhone';
  }
  
  // Priority 3: Search by email only
  if (email) {
    return '/api/bookings/search/findByCustomerEmail';
  }
  
  // Priority 4: Search by phone only
  if (phone) {
    return '/api/bookings/search/findByCustomerPhone';
  }
  
  // Priority 5: Search by date range and status
  if (startDate && endDate && status) {
    return '/api/bookings/search/findByDateRangeAndStatus';
  }
  
  // Priority 6: Search by date range only
  if (startDate && endDate) {
    return '/api/bookings/search/findByDateRange';
  }
  
  // Priority 7: Search by status only
  if (status) {
    return '/api/bookings/search/findByStatus';
  }
  
  // Default to listing all bookings
  return '/api/bookings';
}

/**
 * Search bookings with flexible criteria
 * 
 * @param params - Search parameters
 * @returns Paginated booking results
 * 
 * @example
 * // Search by email
 * const results = await searchBookings({ email: 'john@example.com', page: 0, size: 20 });
 * 
 * @example
 * // Search by date range and status
 * const results = await searchBookings({
 *   startDate: '2025-11-15T00:00:00',
 *   endDate: '2025-11-30T23:59:59',
 *   status: 'CONFIRMED',
 *   page: 0,
 *   size: 50
 * });
 */
export async function searchBookings(
  params: BookingSearchParams = {}
): Promise<HATEOASCollection<Booking>> {
  try {
    const endpoint = getSearchEndpoint(params);
    const isBookingIdSearch = params.bookingId !== undefined;
    
    // For booking ID search, don't add query params
    const queryString = isBookingIdSearch ? '' : buildQueryString(params);
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
    
    // If searching by booking ID, wrap single booking in collection format
    if (isBookingIdSearch && !data._embedded) {
      return {
        _embedded: {
          bookings: [data]
        },
        _links: {
          self: {
            href: `${API_BASE_URL}${endpoint}`
          }
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
 * Search bookings by customer email
 * 
 * @param email - Customer email address (case-insensitive)
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 20)
 * @param sort - Sort criteria (default: 'startDate,desc')
 */
export async function searchByEmail(
  email: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'startDate,desc'
): Promise<HATEOASCollection<Booking>> {
  return searchBookings({ email, page, size, sort });
}

/**
 * Search bookings by customer phone number
 * 
 * @param phone - Customer phone number (exact match, including country code)
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 20)
 * @param sort - Sort criteria (default: 'startDate,desc')
 */
export async function searchByPhone(
  phone: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'startDate,desc'
): Promise<HATEOASCollection<Booking>> {
  return searchBookings({ phone, page, size, sort });
}

/**
 * Search bookings by email OR phone number
 * 
 * @param emailOrPhone - Customer email or phone number
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 20)
 * @param sort - Sort criteria (default: 'startDate,desc')
 */
export async function searchByEmailOrPhone(
  emailOrPhone: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'startDate,desc'
): Promise<HATEOASCollection<Booking>> {
  return searchBookings({ emailOrPhone, page, size, sort });
}

/**
 * Search bookings by status
 * 
 * @param status - Booking status
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 20)
 * @param sort - Sort criteria (default: 'startDate,desc')
 */
export async function searchByStatus(
  status: BookingStatus,
  page: number = 0,
  size: number = 20,
  sort: string = 'startDate,desc'
): Promise<HATEOASCollection<Booking>> {
  return searchBookings({ status, page, size, sort });
}

/**
 * Search bookings by date range
 * 
 * @param startDate - Start date in ISO-8601 format
 * @param endDate - End date in ISO-8601 format
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 20)
 * @param sort - Sort criteria (default: 'startDate,desc')
 */
export async function searchByDateRange(
  startDate: string,
  endDate: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'startDate,desc'
): Promise<HATEOASCollection<Booking>> {
  return searchBookings({ startDate, endDate, page, size, sort });
}

/**
 * Search bookings by date range and status
 * 
 * @param startDate - Start date in ISO-8601 format
 * @param endDate - End date in ISO-8601 format
 * @param status - Booking status
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 20)
 * @param sort - Sort criteria (default: 'startDate,desc')
 */
export async function searchByDateRangeAndStatus(
  startDate: string,
  endDate: string,
  status: BookingStatus,
  page: number = 0,
  size: number = 20,
  sort: string = 'startDate,desc'
): Promise<HATEOASCollection<Booking>> {
  return searchBookings({ startDate, endDate, status, page, size, sort });
}
