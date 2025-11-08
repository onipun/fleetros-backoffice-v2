/**
 * Custom React Hooks for Loyalty System
 * Provides easy-to-use hooks for loyalty features in components
 */

'use client';

import { getLoyaltyAccount, getLoyaltyTiers, redeemPoints } from '@/lib/api/loyalty-api';
import type { RedeemPointsRequest } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch loyalty account for a customer
 */
export function useLoyaltyAccount(customerId: number | null) {
  return useQuery({
    queryKey: ['loyalty-account', customerId],
    queryFn: () => {
      if (!customerId) throw new Error('Customer ID is required');
      return getLoyaltyAccount(customerId);
    },
    enabled: Boolean(customerId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all loyalty tiers
 */
export function useLoyaltyTiers() {
  return useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: getLoyaltyTiers,
    staleTime: 60 * 60 * 1000, // 1 hour - tiers don't change often
  });
}

/**
 * Hook to redeem loyalty points
 */
export function useRedeemPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RedeemPointsRequest) => redeemPoints(request),
    onSuccess: (data, variables) => {
      // Invalidate loyalty account to refresh points balance
      queryClient.invalidateQueries({
        queryKey: ['loyalty-account', data.loyaltyAccountId],
      });
      
      // Invalidate booking queries if bookingId is present
      if (variables.bookingId) {
        queryClient.invalidateQueries({
          queryKey: ['booking', variables.bookingId],
        });
      }
    },
  });
}

/**
 * Hook to calculate available discount from points
 */
export function useLoyaltyDiscount(
  availablePoints: number = 0,
  conversionRate: number = 100
) {
  const maxDiscount = availablePoints / conversionRate;
  
  const calculateDiscount = (pointsToRedeem: number): number => {
    return pointsToRedeem / conversionRate;
  };

  const calculatePoints = (discountAmount: number): number => {
    return Math.floor(discountAmount * conversionRate);
  };

  return {
    maxDiscount,
    calculateDiscount,
    calculatePoints,
    conversionRate,
  };
}

/**
 * Hook to get current tier benefits
 */
export function useCurrentTierBenefits(tierName: string | null) {
  const { data: tiers } = useLoyaltyTiers();

  const currentTier = tiers?.find(t => t.tier === tierName);

  return {
    tier: currentTier,
    benefits: currentTier?.benefits || [],
    pointsMultiplier: currentTier?.pointsMultiplier || 1.0,
    completionBonus: currentTier?.completionBonus || 0,
  };
}

/**
 * Hook for complete loyalty integration in booking flow
 */
export function useLoyaltyForBooking(customerId: number | null) {
  const { data: account, isLoading: accountLoading } = useLoyaltyAccount(customerId);
  const { tier, pointsMultiplier, completionBonus } = useCurrentTierBenefits(
    account?.currentTier || null
  );
  const { maxDiscount, calculateDiscount, calculatePoints } = useLoyaltyDiscount(
    account?.availablePoints || 0
  );

  const calculateEarnedPoints = (bookingAmount: number): number => {
    if (!pointsMultiplier) return 0;
    return Math.floor(bookingAmount * pointsMultiplier + completionBonus);
  };

  return {
    account,
    tier,
    isLoading: accountLoading,
    availablePoints: account?.availablePoints || 0,
    currentTier: account?.currentTier,
    maxDiscount,
    calculateDiscount,
    calculatePoints,
    calculateEarnedPoints,
    isEligible: (account?.availablePoints || 0) >= 100,
  };
}
