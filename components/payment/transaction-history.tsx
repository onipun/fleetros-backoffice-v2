'use client';

/**
 * Transaction History Component
 * 
 * Displays a comprehensive list of financial transactions with:
 * - Filtering by category (pre-rental, during-rental, post-completion, etc.)
 * - Sorting by date, amount, type
 * - Transaction details with status indicators
 * - Grouped view by category
 * 
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
    getSettlementTransactions,
    groupTransactionsByCategory,
} from '@/lib/api/settlement-api';
import { cn } from '@/lib/utils';
import {
    getTransactionTypeInfo,
    type SettlementTransaction
} from '@/types/settlement';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowDownUp,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    Filter,
    Loader2,
    RefreshCw,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface TransactionHistoryProps {
  bookingId: number;
  showFilters?: boolean;
  showExport?: boolean;
  compact?: boolean;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type CategoryFilter = 'all' | 'pre-rental' | 'during-rental' | 'completion' | 'post-completion' | 'adjustment' | 'loyalty';
type StatusFilter = 'all' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export function TransactionHistory({
  bookingId,
  showFilters = true,
  showExport = true,
  compact = false,
}: TransactionHistoryProps) {
  const { formatCurrency } = useLocale();

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  // Fetch transactions
  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['settlement-transactions', bookingId],
    queryFn: () => getSettlementTransactions(bookingId),
    enabled: !!bookingId,
    refetchOnWindowFocus: false,
  });

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Category filter
    if (categoryFilter !== 'all') {
      const categoryTypeMap: Record<CategoryFilter, string[]> = {
        all: [],
        'pre-rental': ['DEPOSIT', 'ADVANCE_PAYMENT', 'PICKUP_PAYMENT'],
        'during-rental': ['INSTALLMENT', 'EXTENSION_FEE', 'ADDITIONAL_CHARGE', 'MODIFICATION_CHARGE'],
        'completion': ['FINAL_SETTLEMENT', 'DEPOSIT_RETURN'],
        'post-completion': [
          'DAMAGE_CHARGE', 'FUEL_CHARGE', 'CLEANING_FEE', 'LATE_FEE',
          'TRAFFIC_FINE', 'PARKING_FINE', 'TOLL_CHARGE', 'INSURANCE_DEDUCTIBLE',
          'INSURANCE_PAYOUT', 'ADMIN_FEE'
        ],
        'adjustment': [
          'REFUND', 'PARTIAL_REFUND', 'GOODWILL_CREDIT', 'PRICE_ADJUSTMENT',
          'WRITE_OFF', 'DISPUTE_ADJUSTMENT'
        ],
        'loyalty': ['POINTS_REDEMPTION', 'VOUCHER_REDEMPTION', 'PROMOTIONAL_DISCOUNT'],
      };

      const allowedTypes = categoryTypeMap[categoryFilter] || [];
      filtered = filtered.filter((t) => allowedTypes.includes(t.type));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
        case 'date-asc':
          return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, categoryFilter, statusFilter, sortOption]);

  // Group transactions by category
  const groupedTransactions = useMemo(() => {
    if (!transactions) return {};
    return groupTransactionsByCategory(transactions);
  }, [transactions]);

  // Export transactions as CSV
  const handleExport = () => {
    if (!filteredTransactions.length) {
      toast({
        title: 'No transactions to export',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['ID', 'Type', 'Amount', 'Currency', 'Status', 'Date', 'Reference', 'Post-Completion'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.currency,
      t.status,
      t.transactionDate,
      t.referenceNumber || '',
      t.isPostCompletion ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-booking-${bookingId}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Transactions exported',
      description: `${filteredTransactions.length} transactions exported to CSV`,
    });
  };

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
            <span>Failed to load transactions</span>
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No transactions recorded for this booking</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription className="mt-1">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showExport && (
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="pre-rental">Pre-Rental</SelectItem>
                  <SelectItem value="during-rental">During Rental</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                  <SelectItem value="post-completion">Post-Completion</SelectItem>
                  <SelectItem value="adjustment">Adjustments</SelectItem>
                  <SelectItem value="loyalty">Loyalty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
              <Select
                value={sortOption}
                onValueChange={(v) => setSortOption(v as SortOption)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="amount-desc">Highest Amount</SelectItem>
                  <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'grouped')}>
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="grouped">Grouped View</TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list" className="mt-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No transactions match the selected filters
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    compact={compact}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Grouped View */}
          <TabsContent value="grouped" className="mt-4 space-y-6">
            {Object.entries(groupedTransactions).map(([category, txns]) => {
              if (txns.length === 0) return null;

              const categoryLabels: Record<string, string> = {
                'pre-rental': 'Pre-Rental Payments',
                'during-rental': 'During Rental',
                'completion': 'Completion',
                'post-completion': 'Post-Completion Charges',
                'adjustment': 'Adjustments',
                'loyalty': 'Loyalty',
              };

              return (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    {categoryLabels[category] || category} ({txns.length})
                  </h4>
                  <div className="space-y-2">
                    {txns.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        compact={compact}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Transaction row component
interface TransactionRowProps {
  transaction: SettlementTransaction;
  formatCurrency: (amount: number) => string;
  formatDate: (date?: string) => string;
  compact?: boolean;
}

function TransactionRow({ transaction, formatCurrency, formatDate, compact }: TransactionRowProps) {
  const typeInfo = getTransactionTypeInfo(transaction.type);
  const isPayment = !typeInfo?.isCharge;
  const isPostCompletion = transaction.isPostCompletion;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <div className="flex items-center gap-2">
          <span>{typeInfo?.icon || '💰'}</span>
          <span className="text-sm">{typeInfo?.label || transaction.type}</span>
          {isPostCompletion && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              Post
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              isPayment ? 'text-green-600' : 'text-amber-600'
            )}
          >
            {isPayment ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </span>
          <Badge className={cn('text-xs', getStatusColor(transaction.status))}>
            {transaction.status}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xl">{typeInfo?.icon || '💰'}</span>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{typeInfo?.label || transaction.type}</p>
            {isPostCompletion && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                Post-Completion
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(transaction.transactionDate)}
            {transaction.referenceNumber && (
              <>
                <span>•</span>
                <span className="font-mono">{transaction.referenceNumber}</span>
              </>
            )}
          </div>
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
        <Badge className={cn('text-xs gap-1', getStatusColor(transaction.status))}>
          {getStatusIcon(transaction.status)}
          {transaction.status}
        </Badge>
      </div>
    </div>
  );
}
