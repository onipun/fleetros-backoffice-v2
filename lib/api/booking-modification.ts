/**
 * Booking Modification API Client
 * 
 * Provides enterprise-grade API functions for:
 * - Getting modification policies
 * - Previewing booking modifications
 * - Executing booking modifications
 * - Retrieving audit trail history
 * 
 * All functions include proper error handling, authentication, and type safety.
 */

import type {
    BookingHistoryResponse,
    BookingModificationResponse,
    ModificationPolicyResponse,
    UpdateBookingRequest,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

/**
 * Get access token from session
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
async function createHeaders(): Promise<Record<string, string>> {
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
 * Handle API errors with proper error messages
 */
function handleApiError(response: Response, data: any): never {
  if (data.message) {
    throw new Error(data.message);
  }
  
  // Construct error message from validation details if available
  if (data.details && typeof data.details === 'object') {
    const errors = Object.values(data.details).join(', ');
    throw new Error(errors);
  }
  
  throw new Error(`API Error: ${response.status} ${response.statusText}`);
}

/**
 * Get modification policy for a booking
 * Shows allowed modifications and associated fees
 */
export async function getModificationPolicy(
  bookingId: number
): Promise<ModificationPolicyResponse> {
  const headers = await createHeaders();
  
  const response = await fetch(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}/modification-policy`,
    {
      method: 'GET',
      headers,
      cache: 'no-store',
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    handleApiError(response, data);
  }
  
  return data;
}

/**
 * Preview modification without committing changes
 * Shows pricing changes, fees, and payment adjustments
 */
export async function previewModification(
  bookingId: number,
  request: UpdateBookingRequest
): Promise<BookingModificationResponse> {
  const headers = await createHeaders();
  
  const response = await fetch(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}/preview-modification`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      cache: 'no-store',
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    handleApiError(response, data);
  }
  
  return data;
}

/**
 * Execute modification and commit all changes
 * Creates audit trail records automatically
 */
export async function executeModification(
  bookingId: number,
  request: UpdateBookingRequest
): Promise<BookingModificationResponse> {
  const headers = await createHeaders();
  
  const response = await fetch(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(request),
      cache: 'no-store',
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    handleApiError(response, data);
  }
  
  return data;
}

/**
 * Get complete audit trail of all modifications made to a booking
 * Returns history in reverse chronological order (newest first)
 */
export async function getModificationHistory(
  bookingId: number
): Promise<BookingHistoryResponse[]> {
  const headers = await createHeaders();
  
  const response = await fetch(
    `${API_BASE_URL}/api/v1/bookings/${bookingId}/history`,
    {
      method: 'GET',
      headers,
      cache: 'no-store',
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    handleApiError(response, data);
  }
  
  return data;
}
