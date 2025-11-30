/**
 * Modification Policy API Service
 * Based on MODIFICATION_POLICY_LOYALTY_INTEGRATION_GUIDE.md
 */

import {
    ApiError,
    CreateModificationPolicyRequest,
    ModificationPolicy,
    UpdateModificationPolicyRequest,
} from '@/types/modification-policy';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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
 * Get a specific modification policy by ID
 */
export async function getModificationPolicyById(id: number): Promise<ModificationPolicy> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/modification-policies/${id}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || `Failed to fetch modification policy with ID: ${id}`);
  }

  return response.json();
}

/**
 * Get the applicable modification policy for a specific booking (tier-aware)
 */
export async function getModificationPolicyForBooking(bookingId: number): Promise<ModificationPolicy> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/modification-policies/booking/${bookingId}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || `Failed to fetch modification policy for booking: ${bookingId}`);
  }

  return response.json();
}

/**
 * Create a new modification policy
 * Automatically deactivates any existing active policy
 */
export async function createModificationPolicy(
  data: CreateModificationPolicyRequest
): Promise<ModificationPolicy> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/modification-policies`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    try {
      const error: ApiError = await response.json();
      if (error.errors && error.errors.length > 0) {
        const fieldErrors = error.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new Error(`Validation failed: ${fieldErrors}`);
      }
      throw new Error(error.message || 'Failed to create modification policy');
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.startsWith('Validation failed:')) {
        throw parseError;
      }
      if (parseError instanceof Error && parseError.message && !parseError.message.startsWith('Unexpected')) {
        throw parseError;
      }
      throw new Error(`Failed to create modification policy: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}

/**
 * Update an existing modification policy
 */
export async function updateModificationPolicy(
  id: number,
  data: UpdateModificationPolicyRequest
): Promise<ModificationPolicy> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/modification-policies/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    try {
      const error: ApiError = await response.json();
      if (error.errors && error.errors.length > 0) {
        const fieldErrors = error.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new Error(`Validation failed: ${fieldErrors}`);
      }
      throw new Error(error.message || `Failed to update modification policy with ID: ${id}`);
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.startsWith('Validation failed:')) {
        throw parseError;
      }
      if (parseError instanceof Error && parseError.message && !parseError.message.startsWith('Unexpected')) {
        throw parseError;
      }
      throw new Error(`Failed to update modification policy: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}

/**
 * Delete a modification policy (soft delete)
 * Sets active=false, policy remains in database for audit trail
 */
export async function deleteModificationPolicy(id: number): Promise<void> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/modification-policies/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });

  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || `Failed to delete modification policy with ID: ${id}`);
  }
}

/**
 * Get all modification policies (not in the guide, but useful for admin interface)
 * This would need to be implemented on the backend if needed
 */
export async function getAllModificationPolicies(): Promise<ModificationPolicy[]> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/modification-policies`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    // If endpoint doesn't exist, return empty array
    if (response.status === 404) {
      return [];
    }
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch modification policies');
  }

  const data = await response.json();
  
  // Handle both array response and HATEOAS response
  if (Array.isArray(data)) {
    return data;
  }
  
  // Handle HATEOAS response (try both possible field names)
  if (data._embedded?.modificationPolicyResponses) {
    return data._embedded.modificationPolicyResponses;
  }
  
  if (data._embedded?.modificationPolicyResponseList) {
    return data._embedded.modificationPolicyResponseList;
  }

  return [];
}
