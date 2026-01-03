/**
 * Stripe Onboarding API Client
 * Handles merchant payment account setup
 * Based on updated API specification
 */

import type {
    DashboardResponse,
    MerchantRegistrationRequest,
    MerchantRegistrationResponse,
    MerchantStatus,
    OnboardingError,
    RecreateAccountRequest,
    RecreateAccountResponse,
    RefreshOnboardingResponse,
} from '@/types/stripe-onboarding';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

/**
 * Get authentication token from session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) return null;
    const data = await response.json();
    return data.accessToken || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Handle API errors consistently
 */
function handleApiError(error: unknown): never {
  if (error instanceof Response) {
    throw {
      message: error.statusText || 'Request failed',
      status: error.status,
    } as OnboardingError;
  }
  throw {
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    status: 500,
  } as OnboardingError;
}

/**
 * Register merchant for Stripe payments
 * POST /api/merchants/onboard
 */
export async function registerMerchant(
  data: MerchantRegistrationRequest
): Promise<MerchantRegistrationResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/merchants/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Registration failed',
        status: response.status,
        ...errorData,
      } as OnboardingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get merchant onboarding status
 * GET /api/merchants/status
 */
export async function getMerchantStatus(): Promise<MerchantStatus> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/merchants/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to fetch status',
        status: response.status,
        ...errorData,
      } as OnboardingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Refresh onboarding link
 * POST /api/merchants/refresh-onboarding
 */
export async function refreshOnboardingLink(): Promise<RefreshOnboardingResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/merchants/refresh-onboarding`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to refresh link',
        status: response.status,
        ...errorData,
      } as OnboardingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get Stripe dashboard link
 * GET /api/merchants/dashboard
 */
export async function getDashboardLink(): Promise<DashboardResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/merchants/dashboard`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to get dashboard link',
        status: response.status,
        ...errorData,
      } as OnboardingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Recreate a deleted merchant account
 * POST /api/merchants/recreate
 */
export async function recreateMerchantAccount(
  data: RecreateAccountRequest
): Promise<RecreateAccountResponse> {
  try {
    const token = await getAuthToken();
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/merchants/recreate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || errorData.message || 'Failed to recreate account',
        status: response.status,
        ...errorData,
      } as OnboardingError;
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const status = await getMerchantStatus();
    return status.success && 
           (status.onboardingStatus === 'COMPLETED' || 
            status.onboardingStatus === 'VERIFIED');
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    return false;
  }
}

/**
 * Check if merchant can accept payments
 */
export async function canAcceptPayments(): Promise<boolean> {
  try {
    const status = await getMerchantStatus();
    return status.success && status.canAcceptPayments;
  } catch (error) {
    console.error('Failed to check payment capability:', error);
    return false;
  }
}
