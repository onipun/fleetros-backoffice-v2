'use client';

/**
 * Settlement Detail Card
 * 
 * Displays comprehensive settlement information for a booking including:
 * - Settlement summary (amounts, balances)
 * - Settlement status with close/reopen actions
 * - Transaction history grouped by category
 * - Post-completion charges
 * 
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
    closeSettlement,
    getSettlementCompletionPercentage,
    getSettlementDetails,
    getSettlementStatusInfo,
    reopenSettlement,
} from '@/lib/api/settlement-api';
import { cn } from '@/lib/utils';
import type { SettlementTransaction } from '@/types/settlement';
import { getTransactionTypeInfo } from '@/types/settlement';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    FileText,
    Loader2,
    Lock,
    Plus,
    RefreshCw,
    Unlock,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface SettlementDetailCardProps {
  bookingId: number;
  bookingStatus?: string;
  onAddCharge?: () => void;
  onRecordPayment?: () => void;
  compact?: boolean;
}

export function SettlementDetailCard({
  bookingId,
  bookingStatus,
  onAddCharge,
  onRecordPayment,
  compact = false,
}: SettlementDetailCardProps) {
  const { formatCurrency } = useLocale();
  const queryClient = useQueryClient();
  const [showTransactions, setShowTransactions] = useState(!compact);

  // Fetch settlement details
  const {
    data: settlement,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['settlement', bookingId],
    queryFn: () => getSettlementDetails(bookingId),
    enabled: !!bookingId,
    refetchOnWindowFocus: false,
  });

  // Close settlement mutation
  const closeMutation = useMutation({
    mutationFn: () => {
      const notes = prompt('Enter closing notes (optional):');
      return closeSettlement(bookingId, notes || undefined);
    },
    onSuccess: () => {
      toast({ title: 'Settlement closed successfully' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['booking', String(bookingId)] });
      queryClient.invalidateQueries({ queryKey: ['payment-summary', bookingId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to close settlement',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reopen settlement mutation
  const reopenMutation = useMutation({
    mutationFn: () => {
      const reason = prompt('Enter reason for reopening (required):');
      if (!reason) throw new Error('Reason is required');
      return reopenSettlement(bookingId, reason);
    },
    onSuccess: () => {
      toast({ title: 'Settlement reopened successfully' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['booking', String(bookingId)] });
      queryClient.invalidateQueries({ queryKey: ['payment-summary', bookingId] });
    },
    onError: (error: Error) => {
      if (error.message !== 'Reason is required') {
        toast({
          title: 'Failed to reopen settlement',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  const isLoading$ = closeMutation.isPending || reopenMutation.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load settlement details</span>
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!settlement) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No settlement found for this booking</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, transactions } = settlement;
  const statusInfo = getSettlementStatusInfo(summary.status);
  const completionPercentage = getSettlementCompletionPercentage(summary);
  const isCompleted = bookingStatus === 'COMPLETED';
  const canAddPostCompletion = isCompleted && summary.isOpen;

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Settlement
            </CardTitle>
            <CardDescription className="mt-1">
              Financial settlement for booking #{bookingId}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Settlement Status Badge */}
            <Badge 
              className={cn('gap-1', statusInfo.color)}
              title={statusInfo.description}
            >
              {summary.status === 'OPEN' ? (
                <Unlock className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Settlement Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Original</p>
            <p className="text-sm font-semibold">{formatCurrency(summary.originalAmount)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-sm font-semibold">{formatCurrency(summary.currentAmount)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center bg-green-50 dark:bg-green-950/30">
            <p className="text-xs text-muted-foreground">Received</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(summary.totalReceived)}
            </p>
          </div>
          <div
            className={cn(
              'rounded-lg border p-3 text-center',
              summary.balance > 0
                ? 'bg-orange-50 dark:bg-orange-950/30'
                : 'bg-green-50 dark:bg-green-950/30'
            )}
          >
            <p className="text-xs text-muted-foreground">Balance</p>
            <p
              className={cn(
                'text-sm font-semibold',
                summary.balance > 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-green-600 dark:text-green-400'
              )}
            >
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>

        {/* Additional Charges & Refunds */}
        {(summary.totalCharges > 0 || summary.totalRefunds > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {summary.totalCharges > 0 && (
              <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/30">
                <p className="text-xs text-muted-foreground">Additional Charges</p>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  +{formatCurrency(summary.totalCharges)}
                </p>
              </div>
            )}
            {summary.totalRefunds > 0 && (
              <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/30">
                <p className="text-xs text-muted-foreground">Refunds</p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  -{formatCurrency(summary.totalRefunds)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Payment Status */}
        <div className="flex items-center justify-center gap-2 py-2">
          {summary.balance <= 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Fully Settled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1 text-sm font-medium text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              Balance Outstanding
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {summary.isOpen ? (
            <>
              {onRecordPayment && (
                <Button size="sm" onClick={onRecordPayment}>
                  <Plus className="mr-1 h-4 w-4" />
                  Record Payment
                </Button>
              )}
              {canAddPostCompletion && onAddCharge && (
                <Button size="sm" variant="outline" onClick={onAddCharge}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Charge
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => closeMutation.mutate()}
                disabled={isLoading$ || summary.balance > 0}
              >
                {closeMutation.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-1 h-4 w-4" />
                )}
                Close Settlement
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => reopenMutation.mutate()}
              disabled={isLoading$}
            >
              {reopenMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="mr-1 h-4 w-4" />
              )}
              Reopen Settlement
            </Button>
          )}
        </div>

        {/* Transaction History Toggle */}
        {transactions.length > 0 && (
          <div className="border-t pt-4">
            <button
              type="button"
              className="w-full flex items-center justify-between text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setShowTransactions(!showTransactions)}
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Transaction History ({transactions.length})
              </span>
              {showTransactions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showTransactions && (
              <div className="mt-3 space-y-2">
                {transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settlement Info Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''}
          </span>
          {summary.lastTransactionAt && (
            <span>Last: {formatDate(summary.lastTransactionAt)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Transaction row component
interface TransactionRowProps {
  transaction: SettlementTransaction;
  formatCurrency: (amount: number) => string;
  formatDate: (date?: string) => string;
}

function TransactionRow({ transaction, formatCurrency, formatDate }: TransactionRowProps) {
  const typeInfo = getTransactionTypeInfo(transaction.type);
  const isPayment = !typeInfo?.isCharge;
  const isPostCompletion = transaction.isPostCompletion;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 dark:text-green-400';
      case 'PENDING':
      case 'PROCESSING':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'FAILED':
      case 'CANCELLED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-3 w-3" />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-3">
        <span className="text-lg">{typeInfo?.icon || '💰'}</span>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{typeInfo?.label || transaction.type}</p>
            {isPostCompletion && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                Post
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(transaction.transactionDate)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={cn(
            'text-sm font-semibold',
            isPayment ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
          )}
        >
          {isPayment ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </p>
        <div className={cn('flex items-center gap-1 text-xs', getStatusColor(transaction.status))}>
          {getStatusIcon(transaction.status)}
          <span>{transaction.status}</span>
        </div>
      </div>
    </div>
  );
}
