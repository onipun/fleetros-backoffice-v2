/**
 * Loyalty Program API Service
 * Handles all loyalty-related operations including points, tiers, and redemptions
 */

import type {
    LoyaltyAccount,
    LoyaltyTierInfo,
    LoyaltyTransaction,
    RedeemPointsRequest,
} from '@/types';
import { hateoasClient } from './hateoas-client';

/**
 * Get loyalty account by customer ID
 */
export async function getLoyaltyAccount(customerId: number): Promise<LoyaltyAccount> {
  return hateoasClient.getLoyaltyAccount(customerId);
}

/**
 * Get all loyalty tier information
 */
export async function getLoyaltyTiers(): Promise<LoyaltyTierInfo[]> {
  return hateoasClient.getLoyaltyTiers();
}

/**
 * Redeem loyalty points for a discount
 */
export async function redeemPoints(request: RedeemPointsRequest): Promise<LoyaltyTransaction> {
  return hateoasClient.redeemLoyaltyPoints(request);
}

/**
 * Calculate points earned for a booking amount
 */
export function calculatePointsEarned(
  amount: number,
  tier: string,
  tierMultiplier: number,
  completionBonus: number
): number {
  return Math.floor(amount * tierMultiplier + completionBonus);
}

/**
 * Calculate discount amount from points
 */
export function calculatePointsDiscount(points: number, conversionRate: number = 100): number {
  return points / conversionRate;
}

/**
 * Check if customer has enough points for redemption
 */
export function hasEnoughPoints(
  availablePoints: number,
  pointsToRedeem: number,
  minimumPoints: number = 100
): boolean {
  return availablePoints >= pointsToRedeem && pointsToRedeem >= minimumPoints;
}

/**
 * Get tier information by tier name
 */
export function getTierInfo(
  tiers: LoyaltyTierInfo[],
  tierName: string
): LoyaltyTierInfo | undefined {
  return tiers.find(tier => tier.tier === tierName);
}

/**
 * Validate points redemption request
 */
export interface PointsRedemptionValidation {
  isValid: boolean;
  errors: string[];
  maxRedeemable: number;
}

export function validatePointsRedemption(
  availablePoints: number,
  pointsToRedeem: number,
  minimumPoints: number = 100,
  maxDiscountPercentage: number = 0.5
): PointsRedemptionValidation {
  const errors: string[] = [];
  
  if (pointsToRedeem < minimumPoints) {
    errors.push(`Minimum ${minimumPoints} points required for redemption`);
  }
  
  if (pointsToRedeem > availablePoints) {
    errors.push(`Insufficient points. Available: ${availablePoints}, Requested: ${pointsToRedeem}`);
  }
  
  const maxRedeemable = Math.floor(availablePoints);
  
  return {
    isValid: errors.length === 0,
    errors,
    maxRedeemable,
  };
}
