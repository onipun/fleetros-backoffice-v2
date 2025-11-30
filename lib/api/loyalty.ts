/**
 * Loyalty System API Service
 * Based on MODIFICATION_POLICY_LOYALTY_INTEGRATION_GUIDE.md
 */

import {
    ApiError,
    CreateLoyaltyConfigurationRequest,
    CustomerLoyaltyAccount,
    LoyaltyConfiguration,
    LoyaltyConfigurationListResponse,
    LoyaltyTier,
    LoyaltyTransaction,
    LoyaltyTransactionListResponse,
    UpdateLoyaltyConfigurationRequest,
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

// ============================================================
// LOYALTY CONFIGURATION ENDPOINTS
// ============================================================

/**
 * Get all loyalty tier configurations
 */
export async function getAllLoyaltyConfigurations(): Promise<LoyaltyConfiguration[]> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/loyalty/configurations`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to fetch loyalty configurations');
  }

  const data: LoyaltyConfigurationListResponse = await response.json();
  
  // Handle HATEOAS response (try both possible field names)
  if (data._embedded?.loyaltyConfigurationResponses) {
    return data._embedded.loyaltyConfigurationResponses;
  }
  
  if (data._embedded?.loyaltyConfigurationResponseList) {
    return data._embedded.loyaltyConfigurationResponseList;
  }
  
  return [];
}

/**
 * Get loyalty configuration for a specific tier
 */
export async function getLoyaltyConfigurationByTier(
  tier: Exclude<LoyaltyTier, null>
): Promise<LoyaltyConfiguration> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/loyalty/configurations/${tier}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || `Failed to fetch loyalty configuration for tier: ${tier}`);
  }

  return response.json();
}

/**
 * Create a new loyalty tier configuration
 * Automatically deactivates any existing configuration for the same tier
 */
export async function createLoyaltyConfiguration(
  data: CreateLoyaltyConfigurationRequest
): Promise<LoyaltyConfiguration> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/loyalty/configurations`, {
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
      throw new Error(error.message || 'Failed to create loyalty configuration');
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.startsWith('Validation failed:')) {
        throw parseError;
      }
      if (parseError instanceof Error && parseError.message && !parseError.message.startsWith('Unexpected')) {
        throw parseError;
      }
      throw new Error(`Failed to create loyalty configuration: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}

/**
 * Update an existing loyalty tier configuration
 */
export async function updateLoyaltyConfiguration(
  id: number,
  data: UpdateLoyaltyConfigurationRequest
): Promise<LoyaltyConfiguration> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/loyalty/configurations/${id}`, {
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
      throw new Error(error.message || `Failed to update loyalty configuration with ID: ${id}`);
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.startsWith('Validation failed:')) {
        throw parseError;
      }
      if (parseError instanceof Error && parseError.message && !parseError.message.startsWith('Unexpected')) {
        throw parseError;
      }
      throw new Error(`Failed to update loyalty configuration: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}

/**
 * Delete a loyalty tier configuration (soft delete)
 * Sets active=false, configuration remains in database for audit trail
 */
export async function deleteLoyaltyConfiguration(id: number): Promise<void> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/loyalty/configurations/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });

  if (!response.ok && response.status !== 204) {
    const error: ApiError = await response.json();
    throw new Error(error.message || `Failed to delete loyalty configuration with ID: ${id}`);
  }
}

// ============================================================
// LOYALTY CUSTOMER ENDPOINTS
// ============================================================

/**
 * Get customer loyalty account by customer ID
 */
export async function getCustomerLoyaltyAccount(customerId: number): Promise<CustomerLoyaltyAccount> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/loyalty/customers/${customerId}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || `Failed to fetch loyalty account for customer: ${customerId}`);
  }

  return response.json();
}

/**
 * Get customer loyalty account by email address
 */
export async function getCustomerLoyaltyAccountByEmail(email: string): Promise<CustomerLoyaltyAccount> {
  const headers = await createHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/loyalty/customers/by-email?email=${encodeURIComponent(email)}`,
    {
      method: 'GET',
      headers,
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || `Failed to fetch loyalty account for email: ${email}`);
  }

  return response.json();
}

/**
 * Get transaction history for a customer's loyalty account
 */
export async function getCustomerLoyaltyTransactions(customerId: number): Promise<LoyaltyTransaction[]> {
  const headers = await createHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/loyalty/customers/${customerId}/transactions`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || `Failed to fetch transactions for customer: ${customerId}`);
  }

  const data: LoyaltyTransactionListResponse = await response.json();
  return data._embedded?.loyaltyTransactionResponseList || [];
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate tier benefits summary from configuration
 */
export function getTierBenefitsSummary(config: LoyaltyConfiguration) {
  return {
    tier: config.tier,
    displayName: config.displayName,
    pointsMultiplier: `${config.pointsPerCurrencyUnit}x`,
    bookingBonus: config.bookingCompletionBonus,
    priorityCheckIn: config.priorityCheckIn,
    freeUpgrade: config.freeUpgrade,
    guaranteedAvailability: config.guaranteedAvailability,
    guaranteedHours: config.guaranteedAvailabilityHours,
    tierDiscount: `${config.tierDiscountPercentage}%`,
    freeDriverDays: config.freeAdditionalDriverDays,
  };
}

/**
 * Calculate next tier progress for a customer
 */
export function calculateNextTier(
  account: CustomerLoyaltyAccount,
  currentConfig: LoyaltyConfiguration
) {
  const tierOrder: Array<Exclude<LoyaltyTier, null>> = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const currentIndex = tierOrder.indexOf(account.currentTier);

  if (currentIndex === tierOrder.length - 1) {
    return {
      tier: 'PLATINUM' as const,
      message: 'You are at the highest tier!',
      progress: 100,
      rentalsNeeded: 0,
      currentProgress: account.rentalsCurrentYear,
      targetProgress: account.rentalsCurrentYear,
    };
  }

  const rentalsNeeded = currentConfig.maximumRentalsPerYear 
    ? Math.max(0, currentConfig.maximumRentalsPerYear + 1 - account.rentalsCurrentYear)
    : 0;

  const targetProgress = currentConfig.maximumRentalsPerYear 
    ? currentConfig.maximumRentalsPerYear + 1
    : account.rentalsCurrentYear;

  return {
    tier: tierOrder[currentIndex + 1],
    rentalsNeeded,
    currentProgress: account.rentalsCurrentYear,
    targetProgress,
    progress: Math.min(100, (account.rentalsCurrentYear / targetProgress) * 100),
  };
}

/**
 * Get complete customer loyalty summary
 */
export async function getCustomerLoyaltySummary(email: string) {
  const account = await getCustomerLoyaltyAccountByEmail(email);
  const tierConfig = await getLoyaltyConfigurationByTier(account.currentTier);

  const pointsValue = (account.availablePoints / 100).toFixed(2);

  return {
    customer: {
      id: account.customerId,
      email: account.customerEmail,
      name: account.customerName,
    },
    loyalty: {
      tier: account.currentTier,
      tierDisplay: tierConfig.displayName,
      availablePoints: account.availablePoints,
      pointsValue: `${pointsValue} MYR`,
      lifetimePoints: account.lifetimePoints,
      rentalsThisYear: account.rentalsCurrentYear,
      rentalsLifetime: account.rentalsLifetime,
      spendingThisYear: account.spendingCurrentYear,
      spendingLifetime: account.spendingLifetime,
      memberSince: account.memberSince,
    },
    benefits: getTierBenefitsSummary(tierConfig),
    nextTier: calculateNextTier(account, tierConfig),
  };
}
