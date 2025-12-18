/**
 * Customer Spending Search Hook
 * 
 * Enterprise-grade React hook for customer spending summary search operations:
 * - Encapsulates search logic and state management
 * - Provides clean API for components
 * - Handles caching and error states
 * - Follows SOLID principles
 */

import {
    searchCustomerSpending,
    type CustomerSpendingSearchParams,
    type CustomerSpendingSummary
} from '@/lib/api/customer-spending-search';
import { parseHalResource } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export interface UseCustomerSpendingSearchOptions {
  initialParams?: CustomerSpendingSearchParams;
  staleTime?: number;
  enabled?: boolean;
}

export interface UseCustomerSpendingSearchResult {
  // Data
  summaries: CustomerSpendingSummary[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  
  // State
  isLoading: boolean;
  error: Error | null;
  searchParams: CustomerSpendingSearchParams;
  
  // Actions
  search: (params: CustomerSpendingSearchParams) => void;
  reset: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => void;
}

const DEFAULT_PARAMS: CustomerSpendingSearchParams = {
  page: 0,
  size: 20,
  sort: 'totalSpendLifetime,desc',
};

/**
 * Hook for searching customer spending summaries with pagination and filtering
 * 
 * @param options - Configuration options
 * @returns Search state and actions
 * 
 * @example
 * const { summaries, search, reset, nextPage, isLoading } = useCustomerSpendingSearch();
 * 
 * // Search by email
 * search({ email: 'john@example.com' });
 * 
 * // Find top spenders
 * search({ topSpenders: true, size: 10 });
 */
export function useCustomerSpendingSearch(
  options: UseCustomerSpendingSearchOptions = {}
): UseCustomerSpendingSearchResult {
  const {
    initialParams = DEFAULT_PARAMS,
    staleTime = 30000,
    enabled = true,
  } = options;
  
  const [searchParams, setSearchParams] = useState<CustomerSpendingSearchParams>(initialParams);
  
  // React Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer-spending-search', searchParams],
    queryFn: () => searchCustomerSpending(searchParams),
    staleTime,
    enabled,
  });
  
  // Parse response
  const summaries = data ? parseHalResource<CustomerSpendingSummary>(data, 'customerSpendingSummaries') : [];
  const totalPages = data?.page?.totalPages || 0;
  const totalElements = data?.page?.totalElements || 0;
  const currentPage = searchParams.page || 0;
  
  /**
   * Execute search with new parameters
   */
  const search = useCallback((params: CustomerSpendingSearchParams) => {
    setSearchParams({
      ...params,
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: params.sort ?? 'totalSpendLifetime,desc',
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
    summaries,
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
