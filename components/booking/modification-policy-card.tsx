'use client';

/**
 * Modification Policy Card
 * 
 * Displays booking modification policy information with:
 * - Fee structure and timing
 * - Allowed modifications
 * - Visual fee indicators
 * - Responsive design
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getModificationPolicy } from '@/lib/api/booking-modification';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Info,
    Shield,
} from 'lucide-react';

interface ModificationPolicyCardProps {
  bookingId: number;
  className?: string;
  compact?: boolean;
}

export function ModificationPolicyCard({
  bookingId,
  className,
  compact = false,
}: ModificationPolicyCardProps) {
  const { formatCurrency } = useLocale();

  const {
    data: policy,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['booking-modification-policy', bookingId],
    queryFn: () => getModificationPolicy(bookingId),
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !policy) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Modification Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Policy Not Available</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unable to load modification policy'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Fee indicator */}
            <div
              className={cn(
                'rounded-lg border p-3 flex items-center gap-3',
                policy.isFreeModification
                  ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
                  : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20'
              )}
            >
              {policy.isFreeModification ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <DollarSign className="h-5 w-5 text-orange-600" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {policy.isFreeModification ? 'Free Modification' : 'Modification Fee Applies'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {policy.isFreeModification
                    ? `${policy.hoursUntilPickup}h until pickup (${policy.freeModificationHours}h window)`
                    : `Fee: ${formatCurrency(policy.estimatedFee)}`}
                </p>
              </div>
            </div>

            {/* Context message */}
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              {policy.contextMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Modification Policy
        </CardTitle>
        <CardDescription>{policy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Policy name */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="font-semibold mb-3">{policy.policyName}</h4>

          {/* Key information grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Free Modification Window</p>
                <p className="text-sm text-muted-foreground">
                  {policy.freeModificationHours} hours before pickup
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Late Modification Fee</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(policy.lateModificationFee)}
                  <Badge variant="outline" className="ml-2 text-xs">
                    {policy.feeType}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Hours Until Pickup</p>
                <p className="text-sm text-muted-foreground">{policy.hoursUntilPickup} hours</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {policy.isFreeModification ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
              ) : (
                <DollarSign className="h-4 w-4 mt-0.5 text-orange-600" />
              )}
              <div>
                <p className="text-sm font-medium">Estimated Fee</p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    policy.isFreeModification ? 'text-green-600' : 'text-orange-600'
                  )}
                >
                  {policy.isFreeModification ? 'FREE' : formatCurrency(policy.estimatedFee)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Context message banner */}
        <div
          className={cn(
            'rounded-lg border p-3 flex items-start gap-2',
            policy.isFreeModification
              ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
              : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20'
          )}
        >
          <Info
            className={cn(
              'h-5 w-5 mt-0.5',
              policy.isFreeModification ? 'text-green-600' : 'text-orange-600'
            )}
          />
          <p className="text-sm">{policy.contextMessage}</p>
        </div>

        {/* Allowed modifications */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Allowed Modifications:</p>
          <div className="flex flex-wrap gap-2">
            {policy.allowDateChange && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Date Changes
              </Badge>
            )}
            {policy.allowVehicleChange && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Vehicle Changes
              </Badge>
            )}
            {policy.allowLocationChange && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Location Changes
              </Badge>
            )}
            {!policy.allowDateChange &&
              !policy.allowVehicleChange &&
              !policy.allowLocationChange && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  No Modifications Allowed
                </Badge>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
