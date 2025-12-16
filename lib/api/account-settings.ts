/**
 * Account Settings API Service
 * Handles all account settings operations including CRUD for configuration key-value pairs
 */

import type {
    AccountSetting,
    AccountSettingRequest,
    AccountSettingUpdateRequest,
    CommonSettings,
} from '@/types';
import { hateoasClient } from './hateoas-client';

/**
 * Get all account settings
 */
export async function getAllAccountSettings(): Promise<AccountSetting[]> {
  const response = await hateoasClient.getAllAccountSettings();
  return response._embedded?.accountSettingResponses || [];
}

/**
 * Get a specific account setting by key
 */
export async function getAccountSetting(key: string): Promise<AccountSetting | null> {
  try {
    return await hateoasClient.getAccountSetting(key);
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get common account settings as a simple key-value map
 */
export async function getCommonAccountSettings(): Promise<CommonSettings> {
  return hateoasClient.getCommonAccountSettings();
}

/**
 * Create a new account setting
 */
export async function createAccountSetting(
  data: AccountSettingRequest
): Promise<AccountSetting> {
  return hateoasClient.createAccountSetting(data);
}

/**
 * Update an existing account setting
 */
export async function updateAccountSetting(
  key: string,
  data: AccountSettingUpdateRequest
): Promise<AccountSetting> {
  return hateoasClient.updateAccountSetting(key, data);
}

/**
 * Delete an account setting
 */
export async function deleteAccountSetting(key: string): Promise<void> {
  return hateoasClient.deleteAccountSetting(key);
}

/**
 * Create or update a setting (upsert operation)
 */
export async function upsertAccountSetting(
  data: AccountSettingRequest
): Promise<AccountSetting> {
  try {
    // Try to get existing setting
    const existing = await getAccountSetting(data.settingKey);
    
    if (existing) {
      // Update existing
      return await updateAccountSetting(data.settingKey, {
        settingValue: data.settingValue,
        description: data.description,
      });
    } else {
      // Create new
      return await createAccountSetting(data);
    }
  } catch (error: any) {
    // If not found, create new
    if (error.status === 404) {
      return await createAccountSetting(data);
    }
    throw error;
  }
}

/**
 * Get a setting value by key with fallback
 */
export async function getSettingValue(
  key: string,
  defaultValue?: string
): Promise<string | undefined> {
  const setting = await getAccountSetting(key);
  return setting?.settingValue ?? defaultValue;
}

/**
 * Validate setting key format
 */
export function isValidSettingKey(key: string): boolean {
  // Key should be alphanumeric with underscores/hyphens, 1-100 chars
  return /^[a-zA-Z0-9_-]{1,100}$/.test(key);
}

/**
 * Validate setting value format
 */
export function isValidSettingValue(value: string): boolean {
  // Value should not exceed 500 characters
  return value.length <= 500;
}

/**
 * Predefined common setting keys
 */
export const COMMON_SETTING_KEYS = {
  TAX_RATE: 'taxRate',
  SERVICE_FEE_RATE: 'serviceFeeRate',
  CURRENCY: 'currency',
  DEFAULT_DEPOSIT_PERCENTAGE: 'defaultDepositPercentage',
  MAX_BOOKING_DAYS: 'maxBookingDays',
  MIN_BOOKING_DAYS: 'minBookingDays',
  CANCELLATION_WINDOW: 'cancellationWindow',
  LATE_RETURN_FEE: 'lateReturnFee',
} as const;

/**
 * Parse numeric setting value
 */
export function parseNumericSetting(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse boolean setting value
 */
export function parseBooleanSetting(value: string | undefined): boolean {
  if (!value) return false;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Currency type
 */
export type Currency = 'USD' | 'MYR' | 'CNY' | 'SGD';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

/**
 * Get current currency setting
 */
export async function getCurrencySetting(): Promise<Currency> {
  try {
    const token = typeof window !== 'undefined' 
      ? await fetch('/api/auth/session').then(r => r.json()).then(s => s.accessToken)
      : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/account-settings/currency`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return 'MYR'; // Default currency
      }
      throw new Error('Failed to fetch currency setting');
    }

    const data = await response.json();
    return (data.currency as Currency) || 'MYR';
  } catch (error) {
    console.error('Error fetching currency setting:', error);
    return 'MYR'; // Default fallback
  }
}

/**
 * Update currency setting
 */
export async function updateCurrencySetting(currency: Currency): Promise<void> {
  const token = typeof window !== 'undefined' 
    ? await fetch('/api/auth/session').then(r => r.json()).then(s => s.accessToken)
    : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/account-settings/currency`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ currency }),
  });

  if (!response.ok) {
    throw new Error('Failed to update currency setting');
  }
}
