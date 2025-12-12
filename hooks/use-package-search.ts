/**
 * Package Search Hook
 * 
 * Enterprise-grade React hook for package search operations:
 * - Encapsulates search logic and state management
 * - Provides clean API for components
 * - Handles caching and error states
 * - Follows SOLID principles
 */

import { searchPackages, type PackageSearchParams } from '@/lib/api/package-search';
import { parseHalResource } from '@/lib/utils';
import type { Package } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export interface UsePackageSearchOptions {
  initialParams?: PackageSearchParams;
  staleTime?: number;
  enabled?: boolean;
}

export interface UsePackageSearchResult {
  // Data
  packages: Package[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  
  // State
  isLoading: boolean;
  error: Error | null;
  searchParams: PackageSearchParams;
  
  // Actions
  search: (params: PackageSearchParams) => void;
  reset: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => void;
}

const DEFAULT_PARAMS: PackageSearchParams = {
  page: 0,
  size: 20,
  sort: 'name,asc',
};

/**
 * Hook for searching packages with pagination and filtering
 * 
 * @param options - Configuration options
 * @returns Search state and actions
 * 
 * @example
 * const { packages, search, reset, nextPage, isLoading } = usePackageSearch();
 * 
 * // Search by name
 * search({ name: 'weekend' });
 * 
 * // Search valid PERCENTAGE packages
 * search({ modifierType: 'PERCENTAGE', validDate: '2025-06-15T00:00:00' });
 * 
 * // Search high-discount packages
 * search({ maxModifier: 0.80 });
 */
export function usePackageSearch(
  options: UsePackageSearchOptions = {}
): UsePackageSearchResult {
  const {
    initialParams = DEFAULT_PARAMS,
    staleTime = 30000,
    enabled = true,
  } = options;
  
  const [searchParams, setSearchParams] = useState<PackageSearchParams>(initialParams);
  
  // React Query for data fetching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['packages-search', searchParams],
    queryFn: () => searchPackages(searchParams),
    staleTime,
    enabled,
  });
  
  // Parse response
  const packages = data ? parseHalResource<Package>(data, 'packages') : [];
  const totalPages = data?.page?.totalPages || 0;
  const totalElements = data?.page?.totalElements || 0;
  const currentPage = searchParams.page || 0;
  
  /**
   * Execute search with new parameters
   */
  const search = useCallback((params: PackageSearchParams) => {
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
    packages,
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
