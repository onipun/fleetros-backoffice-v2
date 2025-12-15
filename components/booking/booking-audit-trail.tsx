'use client';

/**
 * Booking Audit Trail Component
 * 
 * Enterprise-grade timeline display for booking modification history:
 * - Visual timeline with color-coded events
 * - Before/after state comparison
 * - Expandable details
 * - Responsive design
 * - Real-time updates
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { getModificationHistory } from '@/lib/api/booking-modification';
import { cn } from '@/lib/utils';
import type { BookingHistoryResponse, ChangeType } from '@/types';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock,
    DollarSign,
    Edit3,
    History,
    MapPin,
    Sparkles,
    User,
    XCircle,
} from 'lucide-react';
import { useMemo } from 'react';

interface BookingAuditTrailProps {
  bookingId: number;
  className?: string;
}

const CHANGE_TYPE_CONFIG: Record<
  ChangeType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }
> = {
  CREATED: {
    icon: Sparkles,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-900',
    label: 'Created',
  },
  MODIFIED: {
    icon: Edit3,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-900',
    label: 'Modified',
  },
  CANCELLED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-900',
    label: 'Cancelled',
  },
  COMPLETED: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-900',
    label: 'Completed',
  },
  STATUS_CHANGED: {
    icon: AlertCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-900',
    label: 'Status Changed',
  },
};

// Special config for payment received entries
const PAYMENT_RECEIVED_CONFIG = {
  icon: DollarSign,
  color: 'text-emerald-600',
  bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
  borderColor: 'border-emerald-200 dark:border-emerald-900',
  label: 'Payment Received',
};

// Default config for unknown change types
const DEFAULT_CHANGE_CONFIG = {
  icon: History,
  color: 'text-gray-600',
  bgColor: 'bg-gray-50 dark:bg-gray-950/20',
  borderColor: 'border-gray-200 dark:border-gray-900',
  label: 'Unknown',
};

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function HistoryEntry({ entry }: { entry: BookingHistoryResponse }) {
  const { formatCurrency } = useLocale();
  
  // Check if this is a payment-related entry
  const isPaymentEntry = entry.changeReason?.toLowerCase().includes('payment') ||
    entry.changeReason?.toLowerCase().includes('deposit') ||
    entry.changeReason?.toLowerCase().includes('debit');
  
  const config = isPaymentEntry 
    ? PAYMENT_RECEIVED_CONFIG 
    : (CHANGE_TYPE_CONFIG[entry.changeType] ?? DEFAULT_CHANGE_CONFIG);
  const Icon = config.icon;

  const formattedDate = useMemo(() => {
    return new Date(entry.modifiedAt).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [entry.modifiedAt]);

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />

      {/* Timeline marker */}
      <div
        className={cn(
          'absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2',
          config.borderColor,
          config.bgColor
        )}
      >
        <Icon className={cn('h-3 w-3', config.color)} />
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              {config.label}
              <Badge variant="outline" className="font-normal">
                {entry.changeType}
              </Badge>
            </h4>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Reason */}
        <p className="text-sm italic text-muted-foreground">"{entry.changeReason}"</p>

        {/* Modified by */}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />
          Modified by: <span className="font-medium">{entry.modifiedBy}</span>
        </p>

        {/* Changed fields */}
        {entry.changedFields && entry.changedFields.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">Changed Fields:</p>
            <div className="flex flex-wrap gap-1">
              {entry.changedFields.map((field) => (
                <Badge key={field} variant="secondary" className="text-xs">
                  {formatFieldName(field)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Price details - show more comprehensive pricing information */}
        {(entry.previousAmount !== undefined || entry.newAmount !== undefined || 
          entry.priceDifference !== undefined || entry.modificationFee !== undefined) && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-semibold mb-2">Pricing Details:</p>
            
            {entry.previousAmount !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Previous Amount:</span>
                <span className="font-medium">{formatCurrency(entry.previousAmount)}</span>
              </div>
            )}
            
            {entry.newAmount !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">New Amount:</span>
                <span className="font-medium">{formatCurrency(entry.newAmount)}</span>
              </div>
            )}
            
            {entry.priceDifference !== undefined && entry.priceDifference !== 0 && (
              <div className="flex items-center justify-between text-sm border-t pt-2">
                <span className="font-medium">Price Difference:</span>
                <span
                  className={cn(
                    'font-bold',
                    entry.priceDifference > 0 ? 'text-orange-600' : 'text-green-600'
                  )}
                >
                  {entry.priceDifference > 0 ? '+' : ''}
                  {formatCurrency(entry.priceDifference)}
                </span>
              </div>
            )}
            
            {entry.modificationFee !== undefined && entry.modificationFee > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Modification Fee:</span>
                <span className="font-bold text-orange-600">
                  {formatCurrency(entry.modificationFee)}
                </span>
              </div>
            )}
            
            {/* Total adjustment if both priceDifference and modificationFee exist */}
            {entry.priceDifference !== undefined && entry.modificationFee !== undefined && 
             (entry.priceDifference !== 0 || entry.modificationFee > 0) && (
              <div className="flex items-center justify-between text-sm border-t pt-2">
                <span className="font-semibold">Total Adjustment:</span>
                <span className="font-bold text-lg text-orange-600">
                  +{formatCurrency((entry.priceDifference || 0) + (entry.modificationFee || 0))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Expandable details */}
        {entry.previousState && entry.newState && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm text-primary hover:underline">
              <ChevronDown className="h-4 w-4" />
              View Details
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Before state */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <h5 className="font-semibold text-xs mb-2 text-muted-foreground uppercase">
                    Before
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Dates</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.previousState.startDate).toLocaleDateString()} -{' '}
                          {new Date(entry.previousState.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Amount</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(entry.previousState.currentAmount)}
                        </p>
                      </div>
                    </div>
                    {entry.previousState.vehicles?.[0] && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Vehicle</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.previousState.vehicles[0].vehicleName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* After state */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <h5 className="font-semibold text-xs mb-2 text-muted-foreground uppercase">
                    After
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Dates</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.newState.startDate).toLocaleDateString()} -{' '}
                          {new Date(entry.newState.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Amount</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(entry.newState.currentAmount)}
                        </p>
                      </div>
                    </div>
                    {entry.newState.vehicles?.[0] && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Vehicle</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.newState.vehicles[0].vehicleName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

export function BookingAuditTrail({ bookingId, className }: BookingAuditTrailProps) {
  const {
    data: history,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['booking-history', bookingId],
    queryFn: () => getModificationHistory(bookingId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Booking History
          </CardTitle>
          <CardDescription>Loading modification history...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Booking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Failed to Load History</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Booking History
        </CardTitle>
        <CardDescription>
          Complete audit trail of all changes made to this booking
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!history || history.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">No History Available</p>
            <p className="text-sm text-muted-foreground">
              This booking has no modification history yet.
            </p>
          </div>
        ) : (
          <div className="relative">
            {history.map((entry) => (
              <HistoryEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
