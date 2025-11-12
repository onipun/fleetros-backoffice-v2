/**
 * Booking Search Hook
 * 
 * Enterprise-grade React hook for booking search operations:
 * - Encapsulates search logic and state management
 * - Provides clean API for components
 * - Handles caching and error states
 * - Follows SOLID principles
 */

import { searchBookings, type BookingSearchParams } from '@/lib/api/booking-search';
import { parseHalResource } from '@/lib/utils';
import type { Booking } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export interface UseBookingSearchOptions {
  initialParams?: BookingSearchParams;
  staleTime?: number;
  enabled?: boolean;
}

export interface UseBookingSearchResult {
  // Data
  bookings: Booking[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  
  // State
  isLoading: boolean;
  error: Error | null;
  searchParams: BookingSearchParams;
  
  // Actions
  search: (params: BookingSearchParams) => void;
  reset: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => void;
}

const DEFAULT_PARAMS: BookingSearchParams = {
  page: 0,
  size: 20,
  sort: 'startDate,desc',
};

/**
 * Hook for searching bookings with pagination and filtering
 * 
 * @param options - Configuration options
 * @returns Search state and actions
 * 
 * @example
 * const { bookings, search, reset, nextPage, isLoading } = useBookingSearch();
 * 
 * // Search by email
 * search({ emailOrPhone: 'john@example.com' });
 * 
 * // Search by date range
 * search({
 *   startDate: '2025-11-15T00:00:00',
 *   endDate: '2025-11-30T23:59:59'
 * });
 */
export function useBookingSearch(
  options: UseBookingSearchOptions = {}
): UseBookingSearchResult {
  const {
    initialParams = DEFAULT_PARAMS,
    staleTime = 30000,
    enabled = true,
  } = options;
  
  const [searchParams, setSearchParams] = useState<BookingSearchParams>(initialParams);
  
  // React Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bookings-search', searchParams],
    queryFn: () => searchBookings(searchParams),
    staleTime,
    enabled,
  });
  
  // Parse response
  const bookings = data ? parseHalResource<Booking>(data, 'bookings') : [];
  const totalPages = data?.page?.totalPages || 0;
  const totalElements = data?.page?.totalElements || 0;
  const currentPage = searchParams.page || 0;
  
  /**
   * Execute search with new parameters
   */
  const search = useCallback((params: BookingSearchParams) => {
    setSearchParams({
      ...params,
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: params.sort ?? 'startDate,desc',
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
    bookings,
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
