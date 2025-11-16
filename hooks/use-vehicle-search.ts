/**
 * Vehicle Search Hook
 * 
 * Enterprise-grade React hook for vehicle search operations:
 * - Encapsulates search logic and state management
 * - Provides clean API for components
 * - Handles caching and error states
 * - Follows SOLID principles
 */

import { searchVehicles, type VehicleSearchParams } from '@/lib/api/vehicle-search';
import { parseHalResource } from '@/lib/utils';
import type { Vehicle } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export interface UseVehicleSearchOptions {
  initialParams?: VehicleSearchParams;
  staleTime?: number;
  enabled?: boolean;
}

export interface UseVehicleSearchResult {
  // Data
  vehicles: Vehicle[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  
  // State
  isLoading: boolean;
  error: Error | null;
  searchParams: VehicleSearchParams;
  
  // Actions
  search: (params: VehicleSearchParams) => void;
  reset: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => void;
}

const DEFAULT_PARAMS: VehicleSearchParams = {
  page: 0,
  size: 20,
  sort: 'name,asc',
};

/**
 * Hook for searching vehicles with pagination and filtering
 * 
 * @param options - Configuration options
 * @returns Search state and actions
 * 
 * @example
 * const { vehicles, search, reset, nextPage, isLoading } = useVehicleSearch();
 * 
 * // Search available vehicles by name
 * search({ status: 'AVAILABLE', name: 'black' });
 * 
 * // Search by license plate
 * search({ licensePlate: 'ABC-1234' });
 */
export function useVehicleSearch(
  options: UseVehicleSearchOptions = {}
): UseVehicleSearchResult {
  const {
    initialParams = DEFAULT_PARAMS,
    staleTime = 30000,
    enabled = true,
  } = options;
  
  const [searchParams, setSearchParams] = useState<VehicleSearchParams>(initialParams);
  
  // React Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vehicles-search', searchParams],
    queryFn: () => searchVehicles(searchParams),
    staleTime,
    enabled,
  });
  
  // Parse response
  const vehicles = data ? parseHalResource<Vehicle>(data, 'vehicles') : [];
  const totalPages = data?.page?.totalPages || 0;
  const totalElements = data?.page?.totalElements || 0;
  const currentPage = searchParams.page || 0;
  
  /**
   * Execute search with new parameters
   */
  const search = useCallback((params: VehicleSearchParams) => {
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
    vehicles,
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
