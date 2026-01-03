/**
 * Merchant Profile API Client
 * Based on MERCHANT_PROFILE_API_GUIDE.md
 * Handles merchant company profile and payment gateway settings
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

// ============================================
// Types
// ============================================

export type AccountType = 'INDIVIDUAL' | 'BUSINESS';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'INACTIVE';
export type OnboardingStatus = 'NOT_STARTED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ACCOUNT_DELETED';
export type MerchantAccountStatus = 'PENDING' | 'ACTIVE' | 'RESTRICTED' | 'RESTRICTED_SOON' | 'DELETED';

export interface HATEOASLink {
  href: string;
}

export interface MerchantProfileResponse {
  // Account Information
  accountId: number;
  companyName: string;
  description?: string;
  accountType: AccountType;
  accountStatus: AccountStatus;
  email: string;
  phoneNumber?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  createdAt: string;
  
  // Payment Gateway Information
  hasPaymentGatewayAccount: boolean;
  paymentGatewayOnboardingStatus?: OnboardingStatus;
  paymentGatewayAccountStatus?: MerchantAccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  gatewayAccountId?: string;
  gatewayEmail?: string;
  gatewayBusinessName?: string;
  gatewayCountry?: string;
  gatewayPhone?: string;
  lastUpdated?: string;
  
  // HATEOAS Links
  _links: {
    self: HATEOASLink;
    update: HATEOASLink;
    patch: HATEOASLink;
    'payment-gateway-status': HATEOASLink;
    'gateway-status'?: HATEOASLink;
    'gateway-dashboard'?: HATEOASLink;
    'account-settings': HATEOASLink;
    onboard?: HATEOASLink;
    'refresh-onboarding'?: HATEOASLink;
  };
}

export interface MerchantProfileRequest {
  companyName?: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
}

export interface PaymentGatewayStatusResponse {
  hasAccount: boolean;
  isReady: boolean;
  message: string;
  _links: {
    self: HATEOASLink;
    profile: HATEOASLink;
    onboard?: HATEOASLink;
  };
}

export interface APIError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================
// API Functions
// ============================================

/**
 * Get the current merchant profile
 * GET /api/v1/merchant-profile
 */
export async function getMerchantProfile(): Promise<MerchantProfileResponse> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/v1/merchant-profile`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch merchant profile' }));
    throw new Error(error.message || error.error || 'Failed to fetch merchant profile');
  }

  return response.json();
}

/**
 * Fully update the merchant profile (PUT)
 * PUT /api/v1/merchant-profile
 */
export async function updateMerchantProfile(data: MerchantProfileRequest): Promise<MerchantProfileResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please log in and try again.');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE}/api/v1/merchant-profile`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update merchant profile' }));
    throw new Error(error.message || error.error || 'Failed to update merchant profile');
  }

  return response.json();
}

/**
 * Partially update the merchant profile (PATCH)
 * PATCH /api/v1/merchant-profile
 */
export async function patchMerchantProfile(data: Partial<MerchantProfileRequest>): Promise<MerchantProfileResponse> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please log in and try again.');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE}/api/v1/merchant-profile`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update merchant profile' }));
    throw new Error(error.message || error.error || 'Failed to update merchant profile');
  }

  return response.json();
}

/**
 * Get payment gateway status
 * GET /api/v1/merchant-profile/payment-gateway-status
 */
export async function getPaymentGatewayStatus(): Promise<PaymentGatewayStatusResponse> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/v1/merchant-profile/payment-gateway-status`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch payment gateway status' }));
    throw new Error(error.message || error.error || 'Failed to fetch payment gateway status');
  }

  return response.json();
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if payment gateway is ready to receive payments
 */
export function isPaymentGatewayReady(profile: MerchantProfileResponse): boolean {
  return profile.hasPaymentGatewayAccount && 
         profile.chargesEnabled && 
         profile.payoutsEnabled &&
         profile.paymentGatewayOnboardingStatus === 'COMPLETED';
}

/**
 * Get a human-readable onboarding status
 */
export function getOnboardingStatusLabel(status?: OnboardingStatus): string {
  switch (status) {
    case 'NOT_STARTED':
      return 'Not Started';
    case 'PENDING':
      return 'Pending';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'FAILED':
      return 'Failed';
    case 'ACCOUNT_DELETED':
      return 'Account Deleted';
    default:
      return 'Unknown';
  }
}

/**
 * Get a human-readable account status
 */
export function getAccountStatusLabel(status?: MerchantAccountStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'ACTIVE':
      return 'Active';
    case 'RESTRICTED':
      return 'Restricted';
    case 'RESTRICTED_SOON':
      return 'Action Required';
    case 'DELETED':
      return 'Deleted';
    default:
      return 'Unknown';
  }
}
