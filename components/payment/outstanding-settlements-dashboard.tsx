'use client';

/**
 * Outstanding Settlements Dashboard
 * 
 * Displays an overview of all settlements with outstanding balances:
 * - Total outstanding amount across all bookings
 * - List of bookings with unpaid balances
 * - Quick actions for each settlement
 * - Summary statistics
 * 
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    getOutstandingSettlements,
    getTotalOutstandingBalance,
} from '@/lib/api/settlement-api';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Clock,
    DollarSign,
    Eye,
    Loader2,
    RefreshCw,
    Search,
    TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

interface OutstandingSettlementsDashboardProps {
  onViewBooking?: (bookingId: number) => void;
  onRecordPayment?: (bookingId: number) => void;
  compact?: boolean;
}

type SortOption = 'balance-desc' | 'balance-asc' | 'date-desc' | 'date-asc';

export function OutstandingSettlementsDashboard({
  onViewBooking,
  onRecordPayment,
  compact = false,
}: OutstandingSettlementsDashboardProps) {
  const { formatCurrency } = useLocale();

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('balance-desc');

  // Fetch outstanding settlements
  const {
    data: settlements,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['outstanding-settlements'],
    queryFn: getOutstandingSettlements,
    refetchOnWindowFocus: false,
  });

  // Fetch total outstanding balance
  const { data: totalBalance, isLoading: isTotalLoading } = useQuery({
    queryKey: ['outstanding-settlements-total'],
    queryFn: getTotalOutstandingBalance,
    refetchOnWindowFocus: false,
  });

  // Filter and sort settlements
  const filteredSettlements = useMemo(() => {
    if (!settlements) return [];

    let filtered = [...settlements];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.bookingId.toString().includes(query) ||
          s.correlationId?.toLowerCase().includes(query) ||
          s.customerName?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'balance-desc':
          return b.balance - a.balance;
        case 'balance-asc':
          return a.balance - b.balance;
        case 'date-desc':
          return new Date(b.lastTransactionAt || 0).getTime() - new Date(a.lastTransactionAt || 0).getTime();
        case 'date-asc':
          return new Date(a.lastTransactionAt || 0).getTime() - new Date(b.lastTransactionAt || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [settlements, searchQuery, sortOption]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!settlements) return null;

    const total = settlements.length;
    const highBalance = settlements.filter((s) => s.balance > 1000).length;
    const avgBalance = settlements.length > 0
      ? settlements.reduce((sum, s) => sum + s.balance, 0) / settlements.length
      : 0;

    return { total, highBalance, avgBalance };
  }, [settlements]);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-MY', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Get booking status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'CONFIRMED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
            <div>
              <p className="font-medium">Failed to load outstanding settlements</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try again or contact support if the issue persists.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {isTotalLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    formatCurrency(totalBalance || 0)
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Settlements */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Settlements</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High Balance Count */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Balance (&gt;1000)</p>
                <p className="text-2xl font-bold">{stats?.highBalance || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Balance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats?.avgBalance || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Settlements Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Outstanding Settlements
              </CardTitle>
              <CardDescription className="mt-1">
                Bookings with unpaid balances requiring attention
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by booking ID, customer name..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance-desc">Highest Balance</SelectItem>
                <SelectItem value="balance-asc">Lowest Balance</SelectItem>
                <SelectItem value="date-desc">Recent First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredSettlements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No outstanding settlements</p>
              <p className="text-sm mt-1">All bookings are fully settled</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSettlements.map((settlement) => (
                    <TableRow key={settlement.bookingId}>
                      <TableCell className="font-medium">
                        <div>
                          #{settlement.bookingId}
                          {settlement.correlationId && (
                            <span className="text-xs text-muted-foreground block font-mono">
                              {settlement.correlationId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {settlement.customerName || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(settlement.bookingStatus)}>
                          {settlement.bookingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          'font-semibold',
                          settlement.balance > 1000 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                        )}>
                          {formatCurrency(settlement.balance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {settlement.transactionCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(settlement.lastTransactionAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onViewBooking ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onViewBooking(settlement.bookingId)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Link href={`/bookings/${settlement.bookingId}`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {onRecordPayment && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRecordPayment(settlement.bookingId)}
                            >
                              <DollarSign className="mr-1 h-4 w-4" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact Outstanding Settlements Card
 * Shows a summary widget for dashboards
 */
interface OutstandingSettlementsWidgetProps {
  limit?: number;
}

export function OutstandingSettlementsWidget({ limit = 5 }: OutstandingSettlementsWidgetProps) {
  const { formatCurrency } = useLocale();

  const { data: settlements, isLoading } = useQuery({
    queryKey: ['outstanding-settlements'],
    queryFn: getOutstandingSettlements,
    refetchOnWindowFocus: false,
  });

  const { data: totalBalance } = useQuery({
    queryKey: ['outstanding-settlements-total'],
    queryFn: getTotalOutstandingBalance,
    refetchOnWindowFocus: false,
  });

  const topSettlements = useMemo(() => {
    if (!settlements) return [];
    return [...settlements]
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);
  }, [settlements, limit]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Outstanding Settlements
          </CardTitle>
          <Link href="/payments?filter=outstanding">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <CardDescription className="text-lg font-semibold text-orange-600 dark:text-orange-400">
          {formatCurrency(totalBalance || 0)} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {topSettlements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No outstanding settlements
          </p>
        ) : (
          <div className="space-y-3">
            {topSettlements.map((settlement) => (
              <div
                key={settlement.bookingId}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">Booking #{settlement.bookingId}</p>
                  <p className="text-xs text-muted-foreground">
                    {settlement.customerName || 'Unknown customer'}
                  </p>
                </div>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {formatCurrency(settlement.balance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
