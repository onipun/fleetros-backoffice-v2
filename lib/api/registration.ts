/**
 * Master Account Registration API
 * 
 * Handles merchant registration which automatically assigns MERCHANT_ADMIN role
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Registration request payload
 */
export interface MasterAccountRegistrationRequest {
  accountName: string;
  accountDescription?: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  companyName: string;
}

/**
 * Registration response
 */
export interface MasterAccountRegistrationResponse {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  accountId: number;
  accountName: string;
  companyName: string;
  userType: string;
  assignedRoles: string[];
  createdAt: string;
  keycloakUserCreated: boolean;
  keycloakUserId: string;
  emailVerificationSent: boolean;
  message: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Record<string, string>;
}

/**
 * Register a new master account (merchant)
 * 
 * @param data Registration request data
 * @returns Registration response with account details
 */
export async function registerMasterAccount(
  data: MasterAccountRegistrationRequest
): Promise<ApiResponse<MasterAccountRegistrationResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/registration/master-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || responseData.message || 'Registration failed',
        details: responseData.details,
      };
    }

    return {
      success: true,
      data: responseData,
      message: responseData.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
