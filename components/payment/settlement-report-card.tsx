'use client';

/**
 * Settlement Report Card
 * 
 * Displays settlement analytics and summary reporting including:
 * - Total outstanding balance across all settlements
 * - Settlement status breakdown
 * - Quick stats and metrics
 * 
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getOutstandingSettlements, getTotalOutstandingBalance } from '@/lib/api/settlement-api';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    RefreshCw,
    TrendingUp,
    Unlock
} from 'lucide-react';

interface SettlementReportCardProps {
  onViewAllSettlements?: () => void;
  onViewSettlement?: (bookingId: number) => void;
  className?: string;
}

export function SettlementReportCard({
  onViewAllSettlements,
  onViewSettlement,
  className,
}: SettlementReportCardProps) {
  const { formatCurrency } = useLocale();

  // Fetch total outstanding balance
  const {
    data: totalOutstanding = 0,
    isLoading: isLoadingTotal,
    refetch: refetchTotal,
  } = useQuery({
    queryKey: ['settlement-total-outstanding'],
    queryFn: getTotalOutstandingBalance,
    staleTime: 60000, // 1 minute
  });

  // Fetch outstanding settlements list
  const {
    data: outstandingSettlements = [],
    isLoading: isLoadingSettlements,
    refetch: refetchSettlements,
  } = useQuery({
    queryKey: ['settlement-outstanding-list'],
    queryFn: getOutstandingSettlements,
    staleTime: 60000, // 1 minute
  });

  const isLoading = isLoadingTotal || isLoadingSettlements;

  const handleRefresh = () => {
    refetchTotal();
    refetchSettlements();
  };

  // Calculate metrics
  const totalSettlements = outstandingSettlements.length;
  const highPriorityCount = outstandingSettlements.filter(
    (s) => s.balance > 500
  ).length;
  const averageOutstanding = totalSettlements > 0
    ? totalOutstanding / totalSettlements
    : 0;

  // Get top 3 settlements by outstanding balance
  const topSettlements = [...outstandingSettlements]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 3);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Settlement Report
            </CardTitle>
            <CardDescription className="mt-1">
              Overview of settlement status and outstanding balances
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Outstanding */}
          <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 mb-1">
              <AlertCircle className="h-4 w-4" />
              <p className="text-xs font-medium">Total Outstanding</p>
            </div>
            {isLoadingTotal ? (
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                {formatCurrency(totalOutstanding)}
              </p>
            )}
          </div>

          {/* Open Settlements */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Unlock className="h-4 w-4" />
              <p className="text-xs font-medium">Open Settlements</p>
            </div>
            {isLoadingSettlements ? (
              <div className="h-6 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-lg font-bold">{totalSettlements}</p>
            )}
          </div>

          {/* High Priority */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 mb-1">
              <Clock className="h-4 w-4" />
              <p className="text-xs font-medium">High Priority</p>
            </div>
            {isLoadingSettlements ? (
              <div className="h-6 w-8 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-lg font-bold">{highPriorityCount}</p>
            )}
            <p className="text-xs text-muted-foreground">over $500</p>
          </div>

          {/* Average Outstanding */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <p className="text-xs font-medium">Average</p>
            </div>
            {isLoadingSettlements ? (
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-lg font-bold">{formatCurrency(averageOutstanding)}</p>
            )}
          </div>
        </div>

        {/* Top Outstanding Settlements */}
        {topSettlements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Top Outstanding</h4>
              {onViewAllSettlements && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={onViewAllSettlements}
                  className="h-auto p-0 text-xs"
                >
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {topSettlements.map((settlement) => (
                <div
                  key={settlement.bookingId}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg border bg-muted/30',
                    onViewSettlement && 'cursor-pointer hover:bg-muted/50 transition-colors'
                  )}
                  onClick={() => onViewSettlement?.(settlement.bookingId)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Booking #{settlement.bookingId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {settlement.customerName || 'Unknown Customer'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-mono',
                      settlement.balance > 500
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : settlement.balance > 100
                        ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        : ''
                    )}
                  >
                    {formatCurrency(settlement.balance)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && totalSettlements === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
            <p className="text-sm font-medium">All Settlements Cleared</p>
            <p className="text-xs">No outstanding balances</p>
          </div>
        )}

        {/* Quick Actions */}
        {totalSettlements > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {onViewAllSettlements && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAllSettlements}
                className="flex-1"
              >
                <FileText className="mr-1 h-4 w-4" />
                View All Settlements
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
