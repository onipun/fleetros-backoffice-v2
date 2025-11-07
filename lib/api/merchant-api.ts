/**
 * Merchant API Client
 * Handles Stripe merchant onboarding and account management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

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

export interface MerchantStatus {
  success: boolean;
  accountId: number;
  email: string;
  businessName?: string;
  onboardingStatus: string;
  accountStatus: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  canAcceptPayments: boolean;
  isDeleted?: boolean;
  gatewayAccountId?: string;
  message?: string;
  recreationAvailable?: boolean;
}

export interface OnboardingRequest {
  country?: string;
  email?: string;
  businessName?: string;
  phone?: string;
}

export interface OnboardingResponse {
  success: boolean;
  accountId: number;
  onboardingUrl: string;
  onboardingStatus: string;
  accountStatus?: string;
  gatewayAccountId?: string;
  accountLinkExpiresAt?: string;
  message: string;
}

export class MerchantAPI {
  /**
   * Get merchant account status
   */
  async getMerchantStatus(): Promise<MerchantStatus> {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/merchants/status`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch merchant status' }));
      throw new Error(error.error || 'Failed to fetch merchant status');
    }

    return response.json();
  }

  /**
   * Initiate merchant onboarding
   */
  async initiateMerchantOnboarding(
    data: OnboardingRequest
  ): Promise<OnboardingResponse> {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/merchants/onboard`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to initiate onboarding' }));
      throw new Error(error.error || 'Failed to initiate onboarding');
    }

    return response.json();
  }

  /**
   * Recreate a deleted merchant account
   */
  async recreateDeletedAccount(
    data: OnboardingRequest
  ): Promise<OnboardingResponse> {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/merchants/recreate`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to recreate account' }));
      throw new Error(error.error || 'Failed to recreate account');
    }

    return response.json();
  }

  /**
   * Refresh onboarding link for expired sessions
   */
  async refreshOnboardingLink(): Promise<OnboardingResponse> {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/merchants/refresh-link`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to refresh onboarding link' }));
      throw new Error(error.error || 'Failed to refresh onboarding link');
    }

    return response.json();
  }
}

// Export singleton instance
export const merchantAPI = new MerchantAPI();
