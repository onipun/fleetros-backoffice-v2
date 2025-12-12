/**
 * Package Search API Client
 * 
 * Enterprise-grade API client for package search operations following SOLID principles:
 * - Single Responsibility: Handles only package search API calls
 * - Open/Closed: Extensible for new search criteria
 * - Interface Segregation: Clean, focused API
 * 
 * Based on PACKAGE_SEARCH_HATEOAS_API.md specification
 */

import type { HATEOASCollection, Package, PackageModifierType } from '@/types';
import { hateoasClient } from './hateoas-client';

/**
 * Search parameters interface
 * Following PACKAGE_SEARCH_HATEOAS_API.md specification with all 18 search methods
 */
export interface PackageSearchParams {
  // Pagination
  page?: number;
  size?: number;
  sort?: string;
  
  // Search criteria
  name?: string;
  description?: string;
  modifierType?: PackageModifierType | string;
  minModifier?: number;
  maxModifier?: number;
  allowDiscountOnModifier?: boolean;
  minRentalDays?: number;
  validDate?: string;
}

/**
 * Search packages with flexible criteria
 * Automatically selects the most appropriate search endpoint based on provided parameters
 * Supports all 18 search methods from PACKAGE_SEARCH_HATEOAS_API.md
 * 
 * @param params - Search parameters
 * @returns Paginated package results
 * 
 * @example
 * // Search by name
 * const results = await searchPackages({ name: 'weekend' });
 * 
 * @example
 * // Search valid PERCENTAGE packages
 * const results = await searchPackages({ modifierType: 'PERCENTAGE', validDate: '2025-06-15T00:00:00' });
 * 
 * @example
 * // Search high-discount packages (>20% off)
 * const results = await searchPackages({ maxModifier: 0.80 });
 */
export async function searchPackages(
  params: PackageSearchParams = {}
): Promise<HATEOASCollection<Package>> {
  const { 
    name, description, modifierType, minModifier, maxModifier, 
    allowDiscountOnModifier, minRentalDays, validDate,
    page = 0, size = 20, sort = 'name,asc' 
  } = params;
  
  // Build search parameters
  const searchParams = { page, size, sort };
  
  // Priority-based endpoint selection (most specific to least specific)
  // Following SOLID principles: Open/Closed - extensible without modification
  
  // Method #17: Name + Type + Price Range
  if (name && modifierType && minModifier !== undefined && maxModifier !== undefined) {
    return hateoasClient.search<Package>('packages', 'findByNameContainingIgnoreCaseAndModifierTypeIgnoreCaseAndPriceModifierBetween', {
      ...searchParams, name, modifierType, minModifier, maxModifier
    });
  }
  
  // Method #16: Valid Packages by Modifier Type
  if (modifierType && validDate) {
    return hateoasClient.search<Package>('packages', 'findValidPackagesByModifierType', {
      ...searchParams, modifierType, currentDate: validDate
    });
  }
  
  // Method #15: Name + Modifier Type
  if (name && modifierType) {
    return hateoasClient.search<Package>('packages', 'findByNameContainingIgnoreCaseAndModifierTypeIgnoreCase', {
      ...searchParams, name, modifierType
    });
  }
  
  // Method #14: Modifier Type + Price Range
  if (modifierType && minModifier !== undefined && maxModifier !== undefined) {
    return hateoasClient.search<Package>('packages', 'findByModifierTypeIgnoreCaseAndPriceModifierBetween', {
      ...searchParams, modifierType, minModifier, maxModifier
    });
  }
  
  // Method #18: Flexible search with all optional params
  if ((name || description || modifierType || minModifier !== undefined || maxModifier !== undefined || 
       allowDiscountOnModifier !== undefined || minRentalDays !== undefined || validDate) &&
      Object.keys(params).filter(k => !['page', 'size', 'sort'].includes(k)).length > 1) {
    return hateoasClient.search<Package>('packages', 'searchPackages', {
      ...searchParams,
      ...(name && { name }),
      ...(description && { description }),
      ...(modifierType && { modifierType }),
      ...(minModifier !== undefined && { minModifier }),
      ...(maxModifier !== undefined && { maxModifier }),
      ...(allowDiscountOnModifier !== undefined && { allowDiscountOnModifier }),
      ...(minRentalDays !== undefined && { minRentalDays }),
      ...(validDate && { validDate })
    });
  }
  
  // Method #8: Find Valid Packages
  if (validDate) {
    return hateoasClient.search<Package>('packages', 'findValidPackages', {
      ...searchParams, currentDate: validDate
    });
  }
  
  // Method #5: Price Modifier Range
  if (minModifier !== undefined && maxModifier !== undefined) {
    return hateoasClient.search<Package>('packages', 'findByPriceModifierBetween', {
      ...searchParams, minModifier, maxModifier
    });
  }
  
  // Method #6: Maximum Modifier
  if (maxModifier !== undefined) {
    return hateoasClient.search<Package>('packages', 'findByPriceModifierLessThanEqual', {
      ...searchParams, maxModifier
    });
  }
  
  // Method #7: Minimum Modifier
  if (minModifier !== undefined) {
    return hateoasClient.search<Package>('packages', 'findByPriceModifierGreaterThanEqual', {
      ...searchParams, minModifier
    });
  }
  
  // Method #12: Minimum Rental Days
  if (minRentalDays !== undefined) {
    return hateoasClient.search<Package>('packages', 'findByMinRentalDaysLessThanEqual', {
      ...searchParams, days: minRentalDays
    });
  }
  
  // Method #4: Discount Allowance
  if (allowDiscountOnModifier !== undefined) {
    return hateoasClient.search<Package>('packages', 'findByAllowDiscountOnModifier', {
      ...searchParams, allowDiscountOnModifier
    });
  }
  
  // Method #3: Modifier Type
  if (modifierType) {
    return hateoasClient.search<Package>('packages', 'findByModifierTypeIgnoreCase', {
      ...searchParams, modifierType
    });
  }
  
  // Method #2: Name only
  if (name) {
    return hateoasClient.search<Package>('packages', 'findByNameContainingIgnoreCase', {
      ...searchParams, name
    });
  }
  
  // Default: get all packages
  return hateoasClient.getCollection<Package>('packages', searchParams);
}

/**
 * Search packages by name only
 */
export async function searchByName(
  name: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Package>> {
  return searchPackages({ name, page, size, sort });
}

/**
 * Search packages by modifier type only
 */
export async function searchByModifierType(
  modifierType: PackageModifierType | string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Package>> {
  return searchPackages({ modifierType, page, size, sort });
}

/**
 * Search packages by discount allowance
 */
export async function searchByDiscountAllowance(
  allowDiscountOnModifier: boolean,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Package>> {
  return searchPackages({ allowDiscountOnModifier, page, size, sort });
}

/**
 * Search packages by price modifier range
 */
export async function searchByModifierRange(
  minModifier: number,
  maxModifier: number,
  page: number = 0,
  size: number = 20,
  sort: string = 'priceModifier,asc'
): Promise<HATEOASCollection<Package>> {
  return searchPackages({ minModifier, maxModifier, page, size, sort });
}

/**
 * Find currently valid packages
 */
export async function findValidPackages(
  currentDate?: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Package>> {
  return searchPackages({ validDate: currentDate || new Date().toISOString(), page, size, sort });
}

/**
 * Search packages by modifier type and price range
 */
export async function searchByTypeAndModifierRange(
  modifierType: PackageModifierType | string,
  minModifier: number,
  maxModifier: number,
  page: number = 0,
  size: number = 20,
  sort: string = 'priceModifier,asc'
): Promise<HATEOASCollection<Package>> {
  return searchPackages({ modifierType, minModifier, maxModifier, page, size, sort });
}

/**
 * Search valid packages by modifier type
 */
export async function findValidPackagesByType(
  modifierType: PackageModifierType | string,
  currentDate?: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Package>> {
  return searchPackages({ 
    modifierType, 
    validDate: currentDate || new Date().toISOString(), 
    page, 
    size, 
    sort 
  });
}

/**
 * Search packages by minimum rental days requirement
 */
export async function searchByMinRentalDays(
  days: number,
  page: number = 0,
  size: number = 20,
  sort: string = 'minRentalDays,asc'
): Promise<HATEOASCollection<Package>> {
  return searchPackages({ minRentalDays: days, page, size, sort });
}

/**
 * Get all packages with pagination
 */
export async function getAllPackages(
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Package>> {
  return searchPackages({ page, size, sort });
}
