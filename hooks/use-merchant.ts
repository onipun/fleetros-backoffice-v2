/**
 * React hooks for merchant operations
 * Provides React Query hooks for merchant API calls
 */

import { merchantAPI, type MerchantStatus, type OnboardingRequest, type OnboardingResponse } from '@/lib/api/merchant-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Query key for merchant status
 */
export const MERCHANT_STATUS_QUERY_KEY = ['merchant', 'status'];

/**
 * Hook to fetch merchant status
 */
export function useMerchantStatus() {
  return useQuery<MerchantStatus>({
    queryKey: MERCHANT_STATUS_QUERY_KEY,
    queryFn: () => merchantAPI.getMerchantStatus(),
    retry: 1,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to initiate merchant onboarding
 */
export function useInitiateOnboarding() {
  const queryClient = useQueryClient();

  return useMutation<OnboardingResponse, Error, OnboardingRequest>({
    mutationFn: (request: OnboardingRequest) => merchantAPI.initiateMerchantOnboarding(request),
    onSuccess: () => {
      // Invalidate merchant status to refresh data
      queryClient.invalidateQueries({ queryKey: MERCHANT_STATUS_QUERY_KEY });
    },
  });
}

/**
 * Hook to recreate a deleted merchant account
 */
export function useRecreateAccount() {
  const queryClient = useQueryClient();

  return useMutation<OnboardingResponse, Error, OnboardingRequest>({
    mutationFn: (request: OnboardingRequest) => merchantAPI.recreateDeletedAccount(request),
    onSuccess: () => {
      // Invalidate merchant status to refresh data
      queryClient.invalidateQueries({ queryKey: MERCHANT_STATUS_QUERY_KEY });
    },
  });
}

/**
 * Hook to refresh onboarding link
 */
export function useRefreshOnboardingLink() {
  const queryClient = useQueryClient();

  return useMutation<OnboardingResponse, Error, void>({
    mutationFn: () => merchantAPI.refreshOnboardingLink(),
    onSuccess: () => {
      // Invalidate merchant status to refresh data
      queryClient.invalidateQueries({ queryKey: MERCHANT_STATUS_QUERY_KEY });
    },
  });
}
