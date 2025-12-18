'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerSpendingSummary } from '@/lib/api/customer-spending-search';
import {
    Activity,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    User
} from 'lucide-react';

interface CustomerSpendingTableProps {
  summaries: CustomerSpendingSummary[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  isLoading: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onGoToPage: (page: number) => void;
}

/**
 * Customer Spending Summary Table Component
 * 
 * Displays customer spending summaries in a professional table format with:
 * - Customer identification (email/name)
 * - Financial metrics (total spend, balance, paid, refunded)
 * - Booking statistics (total, completed, active, cancelled)
 * - Activity dates
 * - Pagination controls
 */
export function CustomerSpendingTable({
  summaries,
  totalPages,
  totalElements,
  currentPage,
  isLoading,
  onNextPage,
  onPreviousPage,
  onGoToPage,
}: CustomerSpendingTableProps) {
  const { t, locale } = useLocale();

  /**
   * Format currency with locale
   */
  const formatAmount = (amount: number, currency: string = 'MYR') => {
    // Format with locale, prepend currency code
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
    return formatted;
  };

  /**
   * Format date with locale
   */
  const formatDateShort = (date: string | undefined) => {
    if (!date) return '—';
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(date));
    } catch {
      return '—';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (summaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('customerSpending.noResults') || 'No Results Found'}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {t('customerSpending.noResultsHint') || 'Try adjusting your search criteria or filters'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t('customerSpending.customer') || 'Customer'}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">{t('customerSpending.totalSpend') || 'Total Spend'}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">{t('customerSpending.balanceDue') || 'Balance Due'}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">{t('customerSpending.totalPaid') || 'Total Paid'}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">{t('customerSpending.bookings') || 'Bookings'}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">{t('customerSpending.avgBooking') || 'Avg Booking'}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{t('customerSpending.lastActivity') || 'Last Activity'}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summaries.map((summary) => (
                  <tr key={summary.id} className="hover:bg-muted/30">
                    {/* Customer Info */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        {summary.customerName && (
                          <span className="font-medium truncate max-w-[180px]">{summary.customerName}</span>
                        )}
                        {summary.customerEmail && (
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{summary.customerEmail}</span>
                        )}
                        {summary.customerPhone && (
                          <span className="text-xs text-muted-foreground">{summary.customerPhone}</span>
                        )}
                        {!summary.customerName && !summary.customerEmail && (
                          <span className="text-muted-foreground">
                            #{summary.customerId || summary.id}
                          </span>
                        )}
                        {summary.activeBookings > 0 && (
                          <Badge variant="default" className="w-fit mt-1 bg-blue-500 hover:bg-blue-600 text-xs">
                            <Activity className="h-3 w-3 mr-1" />
                            {summary.activeBookings} {t('customerSpending.active') || 'Active'}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Total Spend */}
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatAmount(summary.totalSpendLifetime, summary.currency)}
                      </span>
                    </td>

                    {/* Balance Due */}
                    <td className="px-4 py-3 text-sm text-right">
                      {summary.totalBalancePayment > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center justify-end gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {formatAmount(summary.totalBalancePayment, summary.currency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Total Paid */}
                    <td className="px-4 py-3 text-sm text-right">
                      <span>{formatAmount(summary.totalPaid, summary.currency)}</span>
                      {summary.totalRefunded > 0 && (
                        <div className="text-xs text-red-500">
                          -{formatAmount(summary.totalRefunded, summary.currency)}
                        </div>
                      )}
                    </td>

                    {/* Booking Stats */}
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{summary.totalBookings}</span>
                        <div className="flex gap-1 text-xs">
                          {summary.completedBookings > 0 && (
                            <Badge variant="outline" className="text-green-600 border-green-200 text-xs px-1">
                              {summary.completedBookings} ✓
                            </Badge>
                          )}
                          {summary.cancelledBookings > 0 && (
                            <Badge variant="outline" className="text-red-600 border-red-200 text-xs px-1">
                              {summary.cancelledBookings} ✗
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Average Booking Value */}
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="text-muted-foreground">
                        {formatAmount(summary.averageBookingValue, summary.currency)}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        {summary.lastActivityDate ? (
                          <>
                            <span className="font-medium">{formatDateShort(summary.lastActivityDate)}</span>
                            <span className="text-xs text-muted-foreground">
                              {t('customerSpending.firstBooking') || 'First'}: {formatDateShort(summary.firstBookingDate)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.showing') || 'Showing'} {summaries.length} {t('common.of') || 'of'} {totalElements} {t('customerSpending.customers') || 'customers'}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default CustomerSpendingTable;
