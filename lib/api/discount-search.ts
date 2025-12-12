/**
 * Discount Search API Client
 * 
 * Enterprise-grade API client for discount search operations following SOLID principles:
 * - Single Responsibility: Handles only discount search API calls
 * - Open/Closed: Extensible for new search criteria
 * - Interface Segregation: Clean, focused API
 * 
 * Based on DISCOUNT_SEARCH_HATEOAS_API.md specification
 */

import type { Discount, DiscountScope, DiscountStatus, DiscountType, HATEOASCollection } from '@/types';
import { hateoasClient } from './hateoas-client';

/**
 * Search parameters interface
 * Following DISCOUNT_SEARCH_HATEOAS_API.md specification with all 23 search methods
 */
export interface DiscountSearchParams {
  // Pagination
  page?: number;
  size?: number;
  sort?: string;
  
  // Basic search criteria
  code?: string;
  description?: string;
  type?: DiscountType | string;
  minValue?: number;
  maxValue?: number;
  applicableScope?: DiscountScope | string;
  status?: DiscountStatus | string;
  
  // Boolean flags
  autoApply?: boolean;
  requiresPromoCode?: boolean;
  combinable?: boolean;
  firstTimeCustomerOnly?: boolean;
  
  // Date ranges
  validDate?: string;
  startDate?: string;
  endDate?: string;
  
  // Numeric ranges
  minBookingAmount?: number;
  maxBookingAmount?: number;
  usageLimit?: number;
  minUsageLimit?: number;
  maxUsageLimit?: number;
  minUsageCount?: number;
  maxUsageCount?: number;
  minPriority?: number;
  maxPriority?: number;
  minRentalDays?: number;
  maxRentalDays?: number;
  minFreeDays?: number;
  
  // Usage threshold
  threshold?: number;
}

/**
 * Search discounts with flexible criteria
 * Automatically selects the most appropriate search endpoint based on provided parameters
 * Supports all 23 search methods from DISCOUNT_SEARCH_HATEOAS_API.md
 * 
 * @param params - Search parameters
 * @returns Paginated discount results
 * 
 * @example
 * // Search by code
 * const results = await searchDiscounts({ code: 'SUMMER' });
 * 
 * @example
 * // Search active percentage discounts
 * const results = await searchDiscounts({ type: 'PERCENTAGE', status: 'ACTIVE' });
 * 
 * @example
 * // Find currently valid discounts
 * const results = await searchDiscounts({ validDate: '2025-12-25T00:00:00' });
 */
export async function searchDiscounts(
  params: DiscountSearchParams = {}
): Promise<HATEOASCollection<Discount>> {
  const { 
    code, description, type, minValue, maxValue, applicableScope, status,
    autoApply, requiresPromoCode, combinable, firstTimeCustomerOnly,
    validDate, startDate, endDate,
    minBookingAmount, maxBookingAmount,
    minUsageLimit, maxUsageLimit, minUsageCount, maxUsageCount,
    minPriority, maxPriority, minRentalDays, maxRentalDays, minFreeDays,
    threshold,
    page = 0, size = 20, sort = 'code,asc' 
  } = params;
  
  // Build search parameters
  const searchParams = { page, size, sort };
  
  // Priority-based endpoint selection (most specific to least specific)
  // Following SOLID principles: Open/Closed - extensible without modification
  
  // Method #23: Nearly Exhausted Discounts (specific use case)
  if (threshold !== undefined && Object.keys(params).filter(k => !['page', 'size', 'sort', 'threshold'].includes(k)).length === 0) {
    return hateoasClient.search<Discount>('discounts', 'findNearlyExhaustedDiscounts', {
      ...searchParams, threshold
    });
  }
  
  // Method #22: High Priority Discounts (specific use case)
  if (minPriority !== undefined && Object.keys(params).filter(k => !['page', 'size', 'sort', 'minPriority'].includes(k)).length === 0) {
    return hateoasClient.search<Discount>('discounts', 'findHighPriorityDiscounts', {
      ...searchParams, minPriority
    });
  }
  
  // Method #21: Priority Range
  if (minPriority !== undefined || maxPriority !== undefined) {
    return hateoasClient.search<Discount>('discounts', 'findByPriorityRange', {
      ...searchParams,
      ...(minPriority !== undefined && { minPriority }),
      ...(maxPriority !== undefined && { maxPriority })
    });
  }
  
  // Method #20: Minimum Rental Days Range
  if (minRentalDays !== undefined || maxRentalDays !== undefined) {
    return hateoasClient.search<Discount>('discounts', 'findByMinRentalDaysRange', {
      ...searchParams,
      ...(minRentalDays !== undefined && { minDays: minRentalDays }),
      ...(maxRentalDays !== undefined && { maxDays: maxRentalDays })
    });
  }
  
  // Method #19: Vehicle Upgrade Discounts (specific feature)
  if (Object.keys(params).filter(k => !['page', 'size', 'sort'].includes(k)).length === 0 && 
      sort === 'upgradeDiscounts') {
    return hateoasClient.search<Discount>('discounts', 'findUpgradeDiscounts', searchParams);
  }
  
  // Method #18: BOGO Discounts (specific feature)
  if (Object.keys(params).filter(k => !['page', 'size', 'sort'].includes(k)).length === 0 && 
      sort === 'bogoDiscounts') {
    return hateoasClient.search<Discount>('discounts', 'findBogoDiscounts', searchParams);
  }
  
  // Method #17: Free Days Discounts
  if (minFreeDays !== undefined) {
    return hateoasClient.search<Discount>('discounts', 'findFreeDaysDiscounts', {
      ...searchParams, minFreeDays
    });
  }
  
  // Method #16: First Time Customer Discounts (specific use case)
  if (firstTimeCustomerOnly && Object.keys(params).filter(k => !['page', 'size', 'sort', 'firstTimeCustomerOnly'].includes(k)).length === 0) {
    return hateoasClient.search<Discount>('discounts', 'findFirstTimeCustomerDiscounts', searchParams);
  }
  
  // Method #15: Combinable Discounts (specific use case)
  if (combinable && Object.keys(params).filter(k => !['page', 'size', 'sort', 'combinable'].includes(k)).length === 0) {
    return hateoasClient.search<Discount>('discounts', 'findCombinableDiscounts', searchParams);
  }
  
  // Method #14: Promo Code Discounts (specific use case)
  if (requiresPromoCode && Object.keys(params).filter(k => !['page', 'size', 'sort', 'requiresPromoCode'].includes(k)).length === 0) {
    return hateoasClient.search<Discount>('discounts', 'findPromoCodeDiscounts', searchParams);
  }
  
  // Method #13: Auto-Apply Discounts (specific use case)
  if (autoApply && Object.keys(params).filter(k => !['page', 'size', 'sort', 'autoApply'].includes(k)).length === 0) {
    return hateoasClient.search<Discount>('discounts', 'findAutoApplyDiscounts', searchParams);
  }
  
  // Method #12: Usage Count Range
  if (minUsageCount !== undefined || maxUsageCount !== undefined) {
    return hateoasClient.search<Discount>('discounts', 'findByUsageCountRange', {
      ...searchParams,
      ...(minUsageCount !== undefined && { minCount: minUsageCount }),
      ...(maxUsageCount !== undefined && { maxCount: maxUsageCount })
    });
  }
  
  // Method #11: Usage Limit Range
  if (minUsageLimit !== undefined || maxUsageLimit !== undefined) {
    return hateoasClient.search<Discount>('discounts', 'findByUsageLimitRange', {
      ...searchParams,
      ...(minUsageLimit !== undefined && { minLimit: minUsageLimit }),
      ...(maxUsageLimit !== undefined && { maxLimit: maxUsageLimit })
    });
  }
  
  // Method #10: Available Discounts (specific use case)
  if (Object.keys(params).filter(k => !['page', 'size', 'sort'].includes(k)).length === 0 && 
      sort === 'available') {
    return hateoasClient.search<Discount>('discounts', 'findAvailableDiscounts', searchParams);
  }
  
  // Method #9: Min Booking Amount Range
  if (minBookingAmount !== undefined || maxBookingAmount !== undefined) {
    return hateoasClient.search<Discount>('discounts', 'findByMinBookingAmountRange', {
      ...searchParams,
      ...(minBookingAmount !== undefined && { minAmount: minBookingAmount }),
      ...(maxBookingAmount !== undefined && { maxAmount: maxBookingAmount })
    });
  }
  
  // Method #8: Value Range
  if (minValue !== undefined || maxValue !== undefined) {
    return hateoasClient.search<Discount>('discounts', 'findByValueRange', {
      ...searchParams,
      ...(minValue !== undefined && { minValue }),
      ...(maxValue !== undefined && { maxValue })
    });
  }
  
  // Method #7: Valid Date Range
  if (startDate || endDate) {
    return hateoasClient.search<Discount>('discounts', 'findByValidDateRange', {
      ...searchParams,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
  }
  
  // Method #6: Valid Discounts (specific date)
  if (validDate) {
    return hateoasClient.search<Discount>('discounts', 'findValidDiscounts', {
      ...searchParams, currentDate: validDate
    });
  }
  
  // Method #5: Active Discounts (specific use case)
  if (status === 'ACTIVE' && Object.keys(params).filter(k => !['page', 'size', 'sort', 'status'].includes(k)).length === 0) {
    return hateoasClient.search<Discount>('discounts', 'findActiveDiscounts', searchParams);
  }
  
  // Method #4: By Status
  if (status) {
    return hateoasClient.search<Discount>('discounts', 'findByStatus', {
      ...searchParams, status
    });
  }
  
  // Method #3: By Applicable Scope
  if (applicableScope) {
    return hateoasClient.search<Discount>('discounts', 'findByApplicableScope', {
      ...searchParams, scope: applicableScope
    });
  }
  
  // Method #2: By Type
  if (type && Object.keys(params).filter(k => !['page', 'size', 'sort', 'type'].includes(k)).length === 0) {
    return hateoasClient.search<Discount>('discounts', 'findByType', {
      ...searchParams, type
    });
  }
  
  // Method #1: By Code (partial match)
  if (code && Object.keys(params).filter(k => !['page', 'size', 'sort', 'code'].includes(k)).length === 0) {
    return hateoasClient.search<Discount>('discounts', 'findByCodeContaining', {
      ...searchParams, code
    });
  }
  
  // Method #0: Flexible search with multiple criteria (use when multiple parameters)
  if (Object.keys(params).filter(k => !['page', 'size', 'sort'].includes(k)).length > 0) {
    return hateoasClient.search<Discount>('discounts', 'searchDiscounts', {
      ...searchParams,
      ...(code && { code }),
      ...(description && { description }),
      ...(type && { type }),
      ...(minValue !== undefined && { minValue }),
      ...(maxValue !== undefined && { maxValue }),
      ...(applicableScope && { applicableScope }),
      ...(status && { status }),
      ...(autoApply !== undefined && { autoApply }),
      ...(requiresPromoCode !== undefined && { requiresPromoCode }),
      ...(combinable !== undefined && { combinable }),
      ...(validDate && { validDate })
    });
  }
  
  // Default: Get all discounts
  return hateoasClient.getCollection<Discount>('discounts', searchParams);
}

/**
 * Find discounts by code containing search term (case-insensitive)
 */
export async function findDiscountsByCode(
  code: string,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByCodeContaining', {
    code, page, size, sort
  });
}

/**
 * Find discounts by type
 */
export async function findDiscountsByType(
  type: DiscountType | string,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByType', {
    type, page, size, sort
  });
}

/**
 * Find discounts by applicable scope
 */
export async function findDiscountsByScope(
  scope: DiscountScope | string,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByApplicableScope', {
    scope, page, size, sort
  });
}

/**
 * Find discounts by status
 */
export async function findDiscountsByStatus(
  status: DiscountStatus | string,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByStatus', {
    status, page, size, sort
  });
}

/**
 * Find all active discounts
 */
export async function findActiveDiscounts(
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findActiveDiscounts', {
    page, size, sort
  });
}

/**
 * Find valid discounts at a specific date
 */
export async function findValidDiscounts(
  currentDate: string,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findValidDiscounts', {
    currentDate, page, size, sort
  });
}

/**
 * Find discounts valid within a date range
 */
export async function findDiscountsByDateRange(
  startDate?: string,
  endDate?: string,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByValidDateRange', {
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    page, size, sort
  });
}

/**
 * Find discounts by value range
 */
export async function findDiscountsByValueRange(
  minValue?: number,
  maxValue?: number,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'value,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByValueRange', {
    ...(minValue !== undefined && { minValue }),
    ...(maxValue !== undefined && { maxValue }),
    page, size, sort
  });
}

/**
 * Find discounts by minimum booking amount range
 */
export async function findDiscountsByBookingAmountRange(
  minAmount?: number,
  maxAmount?: number,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'minBookingAmount,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByMinBookingAmountRange', {
    ...(minAmount !== undefined && { minAmount }),
    ...(maxAmount !== undefined && { maxAmount }),
    page, size, sort
  });
}

/**
 * Find available (non-exhausted) discounts
 */
export async function findAvailableDiscounts(
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findAvailableDiscounts', {
    page, size, sort
  });
}

/**
 * Find discounts by usage limit range
 */
export async function findDiscountsByUsageLimitRange(
  minLimit?: number,
  maxLimit?: number,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'maxUses,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByUsageLimitRange', {
    ...(minLimit !== undefined && { minLimit }),
    ...(maxLimit !== undefined && { maxLimit }),
    page, size, sort
  });
}

/**
 * Find discounts by usage count range
 */
export async function findDiscountsByUsageCountRange(
  minCount?: number,
  maxCount?: number,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'usesCount,desc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByUsageCountRange', {
    ...(minCount !== undefined && { minCount }),
    ...(maxCount !== undefined && { maxCount }),
    page, size, sort
  });
}

/**
 * Find nearly exhausted discounts
 */
export async function findNearlyExhaustedDiscounts(
  threshold: number = 90,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'usesCount,desc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findNearlyExhaustedDiscounts', {
    threshold, page, size, sort
  });
}

/**
 * Find auto-apply discounts
 */
export async function findAutoApplyDiscounts(
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'priority,desc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findAutoApplyDiscounts', {
    page, size, sort
  });
}

/**
 * Find promo code discounts
 */
export async function findPromoCodeDiscounts(
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findPromoCodeDiscounts', {
    page, size, sort
  });
}

/**
 * Find combinable discounts
 */
export async function findCombinableDiscounts(
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findCombinableDiscounts', {
    page, size, sort
  });
}

/**
 * Find first-time customer discounts
 */
export async function findFirstTimeCustomerDiscounts(
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'value,desc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findFirstTimeCustomerDiscounts', {
    page, size, sort
  });
}

/**
 * Find free days discounts
 */
export async function findFreeDaysDiscounts(
  minFreeDays?: number,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findFreeDaysDiscounts', {
    ...(minFreeDays !== undefined && { minFreeDays }),
    page, size, sort
  });
}

/**
 * Find BOGO (Buy-One-Get-One) discounts
 */
export async function findBogoDiscounts(
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findBogoDiscounts', {
    page, size, sort
  });
}

/**
 * Find vehicle upgrade discounts
 */
export async function findUpgradeDiscounts(
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'code,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findUpgradeDiscounts', {
    page, size, sort
  });
}

/**
 * Find discounts by minimum rental days range
 */
export async function findDiscountsByMinRentalDaysRange(
  minDays?: number,
  maxDays?: number,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'minRentalDays,asc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByMinRentalDaysRange', {
    ...(minDays !== undefined && { minDays }),
    ...(maxDays !== undefined && { maxDays }),
    page, size, sort
  });
}

/**
 * Find discounts by priority range
 */
export async function findDiscountsByPriorityRange(
  minPriority?: number,
  maxPriority?: number,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'priority,desc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findByPriorityRange', {
    ...(minPriority !== undefined && { minPriority }),
    ...(maxPriority !== undefined && { maxPriority }),
    page, size, sort
  });
}

/**
 * Find high priority discounts
 */
export async function findHighPriorityDiscounts(
  minPriority: number = 10,
  params: Pick<DiscountSearchParams, 'page' | 'size' | 'sort'> = {}
): Promise<HATEOASCollection<Discount>> {
  const { page = 0, size = 20, sort = 'priority,desc' } = params;
  return hateoasClient.search<Discount>('discounts', 'findHighPriorityDiscounts', {
    minPriority, page, size, sort
  });
}
