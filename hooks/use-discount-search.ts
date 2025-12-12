/**
 * Discount Search Hook
 * 
 * Enterprise-grade React hook for discount search operations:
 * - Encapsulates search logic and state management
 * - Provides clean API for components
 * - Handles caching and error states
 * - Follows SOLID principles
 */

import { searchDiscounts, type DiscountSearchParams } from '@/lib/api/discount-search';
import { parseHalResource } from '@/lib/utils';
import type { Discount } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export interface UseDiscountSearchOptions {
  initialParams?: DiscountSearchParams;
  staleTime?: number;
  enabled?: boolean;
}

export interface UseDiscountSearchResult {
  // Data
  discounts: Discount[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  
  // State
  isLoading: boolean;
  error: Error | null;
  searchParams: DiscountSearchParams;
  
  // Actions
  search: (params: DiscountSearchParams) => void;
  reset: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => void;
}

const DEFAULT_PARAMS: DiscountSearchParams = {
  page: 0,
  size: 20,
  sort: 'code,asc',
};

/**
 * Hook for searching discounts with pagination and filtering
 * 
 * @param options - Configuration options
 * @returns Search state and actions
 * 
 * @example
 * const { discounts, search, reset, nextPage, isLoading } = useDiscountSearch();
 * 
 * // Search by code
 * search({ code: 'SUMMER' });
 * 
 * // Search active percentage discounts
 * search({ type: 'PERCENTAGE', status: 'ACTIVE' });
 * 
 * // Find currently valid discounts
 * search({ validDate: '2025-12-25T00:00:00' });
 */
export function useDiscountSearch(
  options: UseDiscountSearchOptions = {}
): UseDiscountSearchResult {
  const {
    initialParams = DEFAULT_PARAMS,
    staleTime = 30000,
    enabled = true,
  } = options;
  
  const [searchParams, setSearchParams] = useState<DiscountSearchParams>(initialParams);
  
  // React Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['discounts-search', searchParams],
    queryFn: () => searchDiscounts(searchParams),
    staleTime,
    enabled,
  });
  
  // Parse response
  const discounts = data ? parseHalResource<Discount>(data, 'discounts') : [];
  const totalPages = data?.page?.totalPages || 0;
  const totalElements = data?.page?.totalElements || 0;
  const currentPage = searchParams.page || 0;
  
  /**
   * Execute search with new parameters
   */
  const search = useCallback((params: DiscountSearchParams) => {
    setSearchParams({
      ...params,
      page: 0, // Reset to first page on new search
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
    if (currentPage < totalPages - 1) {
      setSearchParams(prev => ({
        ...prev,
        page: (prev.page || 0) + 1,
      }));
    }
  }, [currentPage, totalPages]);
  
  /**
   * Navigate to previous page
   */
  const previousPage = useCallback(() => {
    if (currentPage > 0) {
      setSearchParams(prev => ({
        ...prev,
        page: Math.max(0, (prev.page || 0) - 1),
      }));
    }
  }, [currentPage]);
  
  /**
   * Navigate to specific page
   */
  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < totalPages) {
      setSearchParams(prev => ({
        ...prev,
        page,
      }));
    }
  }, [totalPages]);
  
  return {
    // Data
    discounts,
    totalPages,
    totalElements,
    currentPage,
    
    // State
    isLoading,
    error: error as Error | null,
    searchParams,
    
    // Actions
    search,
    reset,
    nextPage,
    previousPage,
    goToPage,
    refetch,
  };
}
