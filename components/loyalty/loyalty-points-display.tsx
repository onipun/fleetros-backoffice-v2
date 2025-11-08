/**
 * Loyalty Points Display Component
 * Shows loyalty account information and point redemption options
 */

'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoyaltyForBooking } from '@/hooks/use-loyalty';
import { Award, Gift, Info, TrendingUp } from 'lucide-react';

interface LoyaltyPointsDisplayProps {
  customerId: number | null;
  bookingAmount?: number;
  pointsToRedeem?: number;
  onPointsChange?: (points: number) => void;
  showRedemption?: boolean;
}

export function LoyaltyPointsDisplay({
  customerId,
  bookingAmount = 0,
  pointsToRedeem = 0,
  onPointsChange,
  showRedemption = true,
}: LoyaltyPointsDisplayProps) {
  const { formatCurrency } = useLocale();
  const {
    account,
    tier,
    isLoading,
    availablePoints,
    currentTier,
    maxDiscount,
    calculateDiscount,
    calculateEarnedPoints,
    isEligible,
  } = useLoyaltyForBooking(customerId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return null;
  }

  const earnedPoints = calculateEarnedPoints(bookingAmount);
  const currentDiscount = calculateDiscount(pointsToRedeem);
  const maxRedeemable = Math.min(availablePoints, Math.floor(bookingAmount * 50)); // Max 50% of booking

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      case 'GOLD':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'SILVER':
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900';
      default:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>Loyalty Rewards</CardTitle>
          </div>
          <Badge className={getTierColor(currentTier || 'BRONZE')}>{currentTier} Member</Badge>
        </div>
        <CardDescription>Your loyalty benefits and points</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Points Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available Points</p>
            <p className="text-2xl font-bold">{availablePoints.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Max Discount</p>
            <p className="text-2xl font-bold">{formatCurrency(maxDiscount)}</p>
          </div>
        </div>

        {/* Tier Benefits */}
        {tier && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Tier Benefits
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Points Multiplier</span>
                <span className="font-medium">{tier.pointsMultiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Bonus</span>
                <span className="font-medium">+{tier.completionBonus} points</span>
              </div>
            </div>
          </div>
        )}

        {/* Points to Earn */}
        {bookingAmount > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-start gap-2">
              <Gift className="h-4 w-4 mt-0.5 text-blue-600" />
              <p className="text-sm text-blue-900">
                You&apos;ll earn <strong>{earnedPoints} points</strong> from this booking (
                {formatCurrency(bookingAmount)} × {tier?.pointsMultiplier || 1}x + {tier?.completionBonus || 0})
              </p>
            </div>
          </div>
        )}

        {/* Points Redemption */}
        {showRedemption && isEligible && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Redeem Points</Label>
                <span className="text-sm text-muted-foreground">
                  {pointsToRedeem} points = {formatCurrency(currentDiscount)}
                </span>
              </div>
              <Input
                type="range"
                value={pointsToRedeem}
                onChange={(e) => onPointsChange?.(Number(e.target.value))}
                max={maxRedeemable}
                min={0}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 points</span>
                <span>{maxRedeemable.toLocaleString()} points max</span>
              </div>
            </div>

            {pointsToRedeem > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                <p className="font-medium text-green-900">
                  Discount: {formatCurrency(currentDiscount)}
                </p>
                <p className="text-green-700">
                  Remaining points: {(availablePoints - pointsToRedeem).toLocaleString()}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPointsChange?.(maxRedeemable)}
              className="w-full"
            >
              Use Maximum Points
            </Button>
          </div>
        )}

        {!isEligible && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-amber-600" />
              <p className="text-sm text-amber-900">
                You need at least 100 points to redeem for discounts. Keep booking to earn more
                points!
              </p>
            </div>
          </div>
        )}

        {/* Conversion Rate Info */}
        <div className="text-center text-xs text-muted-foreground">
          100 points = {formatCurrency(1)} discount
        </div>
      </CardContent>
    </Card>
  );
}
