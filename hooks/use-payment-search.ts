/**
 * Payment Search Hook
 * 
 * Enterprise-grade React hook for payment search operations:
 * - Encapsulates search logic and state management
 * - Provides clean API for components
 * - Handles caching and error states
 * - Follows SOLID principles
 */

import { searchPayments, type PaymentSearchParams } from '@/lib/api/payment-search';
import { parseHalResource } from '@/lib/utils';
import type { Payment } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export interface UsePaymentSearchOptions {
  initialParams?: PaymentSearchParams;
  staleTime?: number;
  enabled?: boolean;
}

export interface UsePaymentSearchResult {
  // Data
  payments: Payment[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  
  // State
  isLoading: boolean;
  error: Error | null;
  searchParams: PaymentSearchParams;
  
  // Actions
  search: (params: PaymentSearchParams) => void;
  reset: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => void;
}

const DEFAULT_PARAMS: PaymentSearchParams = {
  page: 0,
  size: 20,
  sort: 'paymentDate,desc',
};

/**
 * Hook for searching payments with pagination and filtering
 * 
 * @param options - Configuration options
 * @returns Search state and actions
 * 
 * @example
 * const { payments, search, reset, nextPage, isLoading } = usePaymentSearch();
 * 
 * // Search by booking ID
 * search({ bookingId: 123 });
 * 
 * // Search by date range
 * search({
 *   paymentDateFrom: '2025-01-15T00:00:00',
 *   paymentDateTo: '2025-01-30T23:59:59'
 * });
 */
export function usePaymentSearch(
  options: UsePaymentSearchOptions = {}
): UsePaymentSearchResult {
  const {
    initialParams = DEFAULT_PARAMS,
    staleTime = 30000,
    enabled = true,
  } = options;
  
  const [searchParams, setSearchParams] = useState<PaymentSearchParams>(initialParams);
  
  // React Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payments-search', searchParams],
    queryFn: () => searchPayments(searchParams),
    staleTime,
    enabled,
  });
  
  // Parse response
  const payments = data ? parseHalResource<Payment>(data, 'payments') : [];
  const totalPages = data?.page?.totalPages || 0;
  const totalElements = data?.page?.totalElements || 0;
  const currentPage = searchParams.page || 0;
  
  /**
   * Execute search with new parameters
   */
  const search = useCallback((params: PaymentSearchParams) => {
    setSearchParams({
      ...params,
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: params.sort ?? 'paymentDate,desc',
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
    payments,
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
