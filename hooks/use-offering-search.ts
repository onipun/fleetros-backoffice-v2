/**
 * Offering Search Hook
 * 
 * Enterprise-grade React hook for offering search operations:
 * - Encapsulates search logic and state management
 * - Provides clean API for components
 * - Handles caching and error states
 * - Follows SOLID principles
 */

import { searchOfferings, type OfferingSearchParams } from '@/lib/api/offering-search';
import { parseHalResource } from '@/lib/utils';
import type { Offering } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export interface UseOfferingSearchOptions {
  initialParams?: OfferingSearchParams;
  staleTime?: number;
  enabled?: boolean;
}

export interface UseOfferingSearchResult {
  // Data
  offerings: Offering[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  
  // State
  isLoading: boolean;
  error: Error | null;
  searchParams: OfferingSearchParams;
  
  // Actions
  search: (params: OfferingSearchParams) => void;
  reset: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => void;
}

const DEFAULT_PARAMS: OfferingSearchParams = {
  page: 0,
  size: 20,
  sort: 'name,asc',
};

/**
 * Hook for searching offerings with pagination and filtering
 * 
 * @param options - Configuration options
 * @returns Search state and actions
 * 
 * @example
 * const { offerings, search, reset, nextPage, isLoading } = useOfferingSearch();
 * 
 * // Search by name
 * search({ name: 'GPS' });
 * 
 * // Search optional insurance offerings
 * search({ offeringType: 'INSURANCE', isMandatory: false });
 * 
 * // Search equipment in price range
 * search({ offeringType: 'EQUIPMENT', minPrice: 10, maxPrice: 50 });
 */
export function useOfferingSearch(
  options: UseOfferingSearchOptions = {}
): UseOfferingSearchResult {
  const {
    initialParams = DEFAULT_PARAMS,
    staleTime = 30000,
    enabled = true,
  } = options;
  
  const [searchParams, setSearchParams] = useState<OfferingSearchParams>(initialParams);
  
  // React Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['offerings-search', searchParams],
    queryFn: () => searchOfferings(searchParams),
    staleTime,
    enabled,
  });
  
  // Parse response
  const offerings = data ? parseHalResource<Offering>(data, 'offerings') : [];
  const totalPages = data?.page?.totalPages || 0;
  const totalElements = data?.page?.totalElements || 0;
  const currentPage = searchParams.page || 0;
  
  /**
   * Execute search with new parameters
   */
  const search = useCallback((params: OfferingSearchParams) => {
    setSearchParams({
      ...params,
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: params.sort ?? 'name,asc',
    });
  }, []);
  
  /**
   * Reset search to default parameters
   */
  const reset = useCallback(() => {
    setSearchParams(DEFAULT_PARAMS);
  }, []);
  
  /**
   * Navigate to next page
   */
  const nextPage = useCallback(() => {
    setSearchParams(prev => ({
      ...prev,
      page: Math.min((prev.page || 0) + 1, totalPages - 1),
    }));
  }, [totalPages]);
  
  /**
   * Navigate to previous page
   */
  const previousPage = useCallback(() => {
    setSearchParams(prev => ({
      ...prev,
      page: Math.max((prev.page || 0) - 1, 0),
    }));
  }, []);
  
  /**
   * Navigate to specific page
   */
  const goToPage = useCallback((page: number) => {
    setSearchParams(prev => ({
      ...prev,
      page: Math.max(0, Math.min(page, totalPages - 1)),
    }));
  }, [totalPages]);
  
  return {
    offerings,
    totalPages,
    totalElements,
    currentPage,
    isLoading,
    error: error as Error | null,
    searchParams,
    search,
    reset,
    nextPage,
    previousPage,
    goToPage,
    refetch,
  };
}
