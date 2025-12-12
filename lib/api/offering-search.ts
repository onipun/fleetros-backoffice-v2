/**
 * Offering Search API Client
 * 
 * Enterprise-grade API client for offering search operations following SOLID principles:
 * - Single Responsibility: Handles only offering search API calls
 * - Open/Closed: Extensible for new search criteria
 * - Interface Segregation: Clean, focused API
 * 
 * Based on OFFERING_SEARCH_HATEOAS_API.md specification
 */

import type { HATEOASCollection, Offering, OfferingType } from '@/types';
import { hateoasClient } from './hateoas-client';

/**
 * Search parameters interface
 * Following OFFERING_SEARCH_HATEOAS_API.md specification with all 16 search methods
 */
export interface OfferingSearchParams {
  // Pagination
  page?: number;
  size?: number;
  sort?: string;
  
  // Search criteria
  name?: string;
  offeringType?: OfferingType | string;
  minPrice?: number;
  maxPrice?: number;
  isMandatory?: boolean;
  availability?: number;
}

/**
 * Search offerings with flexible criteria
 * Automatically selects the most appropriate search endpoint based on provided parameters
 * Supports all 16 search methods from OFFERING_SEARCH_HATEOAS_API.md
 * 
 * @param params - Search parameters
 * @returns Paginated offering results
 * 
 * @example
 * // Search by name
 * const results = await searchOfferings({ name: 'GPS' });
 * 
 * @example
 * // Search by type and price range
 * const results = await searchOfferings({ offeringType: 'EQUIPMENT', minPrice: 10, maxPrice: 50 });
 * 
 * @example
 * // Search optional insurance offerings
 * const results = await searchOfferings({ offeringType: 'INSURANCE', isMandatory: false });
 */
export async function searchOfferings(
  params: OfferingSearchParams = {}
): Promise<HATEOASCollection<Offering>> {
  const { 
    name, offeringType, minPrice, maxPrice, isMandatory, availability,
    page = 0, size = 20, sort = 'name,asc' 
  } = params;
  
  // Build search parameters
  const searchParams = { page, size, sort };
  
  // Priority-based endpoint selection (most specific to least specific)
  // Following SOLID principles: Open/Closed - extensible without modification
  
  // Method #15: Name + Type + Price Range
  if (name && offeringType && minPrice !== undefined && maxPrice !== undefined) {
    return hateoasClient.search<Offering>('offerings', 'findByNameContainingIgnoreCaseAndOfferingTypeIgnoreCaseAndPriceBetween', {
      ...searchParams, name, offeringType, minPrice, maxPrice
    });
  }
  
  // Method #14: Type + Mandatory + Price Range
  if (offeringType && isMandatory !== undefined && minPrice !== undefined && maxPrice !== undefined) {
    return hateoasClient.search<Offering>('offerings', 'findByOfferingTypeIgnoreCaseAndIsMandatoryAndPriceBetween', {
      ...searchParams, offeringType, isMandatory, minPrice, maxPrice
    });
  }
  
  // Method #13: Type + Mandatory Status
  if (offeringType && isMandatory !== undefined) {
    return hateoasClient.search<Offering>('offerings', 'findByOfferingTypeIgnoreCaseAndIsMandatory', {
      ...searchParams, offeringType, isMandatory
    });
  }
  
  // Method #12: Name + Type
  if (name && offeringType) {
    return hateoasClient.search<Offering>('offerings', 'findByNameContainingIgnoreCaseAndOfferingTypeIgnoreCase', {
      ...searchParams, name, offeringType
    });
  }
  
  // Method #11: Type + Price Range
  if (offeringType && minPrice !== undefined && maxPrice !== undefined) {
    return hateoasClient.search<Offering>('offerings', 'findByOfferingTypeIgnoreCaseAndPriceBetween', {
      ...searchParams, offeringType, minPrice, maxPrice
    });
  }
  
  // Method #16: Flexible search with all optional params (use when multiple criteria)
  if ((name || offeringType || minPrice !== undefined || maxPrice !== undefined || isMandatory !== undefined) &&
      Object.keys(params).filter(k => !['page', 'size', 'sort'].includes(k)).length > 1) {
    return hateoasClient.search<Offering>('offerings', 'searchOfferings', {
      ...searchParams,
      ...(name && { name }),
      ...(offeringType && { offeringType }),
      ...(minPrice !== undefined && { minPrice }),
      ...(maxPrice !== undefined && { maxPrice }),
      ...(isMandatory !== undefined && { isMandatory })
    });
  }
  
  // Method #5: Price Range
  if (minPrice !== undefined && maxPrice !== undefined) {
    return hateoasClient.search<Offering>('offerings', 'findByPriceBetween', {
      ...searchParams, minPrice, maxPrice
    });
  }
  
  // Method #6: Maximum Price
  if (maxPrice !== undefined) {
    return hateoasClient.search<Offering>('offerings', 'findByPriceLessThanEqual', {
      ...searchParams, maxPrice
    });
  }
  
  // Method #7: Minimum Price
  if (minPrice !== undefined) {
    return hateoasClient.search<Offering>('offerings', 'findByPriceGreaterThanEqual', {
      ...searchParams, minPrice
    });
  }
  
  // Method #10: Minimum Availability
  if (availability !== undefined) {
    return hateoasClient.search<Offering>('offerings', 'findByAvailabilityGreaterThan', {
      ...searchParams, availability
    });
  }
  
  // Method #4: Mandatory Status
  if (isMandatory !== undefined) {
    return hateoasClient.search<Offering>('offerings', 'findByIsMandatory', {
      ...searchParams, isMandatory
    });
  }
  
  // Method #2: Type only
  if (offeringType) {
    return hateoasClient.search<Offering>('offerings', 'findByOfferingTypeIgnoreCase', {
      ...searchParams, offeringType
    });
  }
  
  // Method #1: Name only
  if (name) {
    return hateoasClient.search<Offering>('offerings', 'findByNameContainingIgnoreCase', {
      ...searchParams, name
    });
  }
  
  // Default: get all offerings
  return hateoasClient.getCollection<Offering>('offerings', searchParams);
}

/**
 * Search offerings by name only
 */
export async function searchByName(
  name: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Offering>> {
  return searchOfferings({ name, page, size, sort });
}

/**
 * Search offerings by type only
 */
export async function searchByType(
  offeringType: OfferingType | string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Offering>> {
  return searchOfferings({ offeringType, page, size, sort });
}

/**
 * Search offerings by mandatory status
 */
export async function searchByMandatoryStatus(
  isMandatory: boolean,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Offering>> {
  return searchOfferings({ isMandatory, page, size, sort });
}

/**
 * Search offerings by price range
 */
export async function searchByPriceRange(
  minPrice: number,
  maxPrice: number,
  page: number = 0,
  size: number = 20,
  sort: string = 'price,asc'
): Promise<HATEOASCollection<Offering>> {
  return searchOfferings({ minPrice, maxPrice, page, size, sort });
}

/**
 * Search offerings by type and price range
 */
export async function searchByTypeAndPriceRange(
  offeringType: OfferingType | string,
  minPrice: number,
  maxPrice: number,
  page: number = 0,
  size: number = 20,
  sort: string = 'price,asc'
): Promise<HATEOASCollection<Offering>> {
  return searchOfferings({ offeringType, minPrice, maxPrice, page, size, sort });
}

/**
 * Search offerings by type and mandatory status
 */
export async function searchByTypeAndMandatory(
  offeringType: OfferingType | string,
  isMandatory: boolean,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Offering>> {
  return searchOfferings({ offeringType, isMandatory, page, size, sort });
}

/**
 * Search offerings with limited availability
 */
export async function searchByAvailability(
  availability: number,
  page: number = 0,
  size: number = 20,
  sort: string = 'availability,asc'
): Promise<HATEOASCollection<Offering>> {
  return searchOfferings({ availability, page, size, sort });
}

/**
 * Get all offerings with pagination
 */
export async function getAllOfferings(
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Offering>> {
  return searchOfferings({ page, size, sort });
}
