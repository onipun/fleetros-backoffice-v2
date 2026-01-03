/**
 * Stripe Onboarding Types
 * Separate from registration flow - handles payment account setup
 */

export enum OnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
}

export enum AccountStatus {
  PENDING = 'PENDING',
  RESTRICTED = 'RESTRICTED',
  RESTRICTED_SOON = 'RESTRICTED_SOON',
  ENABLED = 'ENABLED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

/**
 * Simplified merchant registration request
 * Based on updated API specification
 */
export interface MerchantRegistrationRequest {
  businessAccountId: string;
  businessName: string;
  country: string;
  phone?: string;
  website?: string;
}

/**
 * Response from merchant registration
 */
export interface MerchantRegistrationResponse {
  success: boolean;
  businessAccountId: string;
  email: string;
  onboardingUrl: string;
  onboardingStatus: OnboardingStatus;
  message: string;
  error?: string;
}

/**
 * Merchant status response
 */
export interface MerchantStatus {
  success: boolean;
  businessAccountId: string;
  email: string;
  businessName: string;
  onboardingStatus: OnboardingStatus;
  accountStatus: AccountStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  canAcceptPayments: boolean;
  requirementsCurrentlyDue?: string[];
  requirementsEventuallyDue?: string[];
  error?: string;
  message?: string;
  // Deleted account fields
  isDeleted?: boolean;
  recreationAvailable?: boolean;
  gatewayAccountId?: string;
  // Link expiration
  accountLinkExpiresAt?: string;
}

/**
 * Response for refreshing onboarding link
 */
export interface RefreshOnboardingResponse {
  success: boolean;
  onboardingUrl: string;
  expiresAt: string;
  error?: string;
}

/**
 * Response for dashboard link
 */
export interface DashboardResponse {
  success: boolean;
  dashboardUrl: string;
  error?: string;
}

/**
 * Request for recreating a deleted merchant account
 */
export interface RecreateAccountRequest {
  country: string;
  email: string;
  businessName?: string;
  phone?: string;
}

/**
 * Response for recreating a deleted merchant account
 */
export interface RecreateAccountResponse {
  success: boolean;
  accountId?: number;
  gatewayAccountId?: string;
  onboardingUrl?: string;
  onboardingStatus?: OnboardingStatus;
  accountStatus?: AccountStatus;
  accountLinkExpiresAt?: string;
  message?: string;
  error?: string;
}

/**
 * Error response structure
 */
export interface OnboardingError {
  message: string;
  code?: string;
  field?: string;
  status: number;
}
