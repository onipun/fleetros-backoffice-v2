'use client';

import { BookingSearchFilters } from '@/components/booking/booking-search-filters';
import { useLocale } from '@/components/providers/locale-provider';
import { TablePageSkeleton } from '@/components/skeletons/page-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useBookingSearch } from '@/hooks/use-booking-search';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function BookingsPage() {
  const { t, formatCurrency, locale } = useLocale();
  
  // Use custom search hook
  const {
    bookings,
    totalPages,
    currentPage,
    isLoading,
    error,
    search,
    reset,
    nextPage,
    previousPage,
    refetch,
  } = useBookingSearch();

  const statusLabels = useMemo(
    () => ({
      PENDING: t('booking.status.pending'),
      CONFIRMED: t('booking.status.confirmed'),
      COMPLETED: t('booking.status.completed'),
      CANCELLED: t('booking.status.cancelled'),
    }),
    [t]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-success/20 text-success';
      case 'PENDING':
        return 'bg-warning/20 text-warning';
      case 'COMPLETED':
        return 'bg-info/20 text-info';
      case 'CANCELLED':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('booking.title')}</h1>
          <p className="text-muted-foreground">
            {t('booking.manage')}
          </p>
        </div>
        <Link href="/bookings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('booking.newBooking')}
          </Button>
        </Link>
      </div>

      {/* Search Filters */}
      <BookingSearchFilters
        onSearch={search}
        onReset={reset}
        isLoading={isLoading}
      />

      {/* Bookings List */}
      {isLoading ? (
        <TablePageSkeleton rows={8} />
      ) : error ? (
        <Card>
          <ErrorDisplay
            title={t('booking.errorTitle')}
            message={`${t('booking.errorMessage')}${error?.message ? ` (${error.message})` : ''}`.trim()}
            onRetry={() => refetch()}
          />
        </Card>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('booking.noBookingsFound')}</p>
          <Link href="/bookings/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t('booking.createFirstBooking')}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('booking.table.booking')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('booking.table.customer')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('booking.table.vehicle')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('booking.table.dates')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('booking.table.pickup')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">{t('booking.table.amount')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('booking.table.status')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookings.map((booking) => {
                      const selfLink = booking._links?.self?.href;
                      const bookingId = booking.id ?? (selfLink ? selfLink.split('/').pop() : undefined);
                      const isFullyPaid = booking.balancePayment != null && booking.balancePayment <= 0;

                      return (
                        <tr key={booking.id ?? selfLink} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-mono">#{booking.id || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[150px]">
                                {booking.guestName || t('common.notAvailable')}
                              </span>
                              {booking.guestEmail && (
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {booking.guestEmail}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">#{booking.vehicleId || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {booking.startDate ? formatDate(booking.startDate, locale).split(',')[0] : 'N/A'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {booking.endDate ? `→ ${formatDate(booking.endDate, locale).split(',')[0]}` : ''}
                                {booking.totalDays ? ` (${booking.totalDays} ${t('booking.daysSuffix')})` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="truncate max-w-[120px] block">
                              {booking.pickupLocation || t('common.notAvailable')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-medium">
                                {booking.finalPrice != null ? formatCurrency(booking.finalPrice) : t('common.notAvailable')}
                              </span>
                              {isFullyPaid ? (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Paid
                                </span>
                              ) : (
                                <span className="text-xs text-orange-600 font-medium">
                                  Due: {booking.balancePayment != null ? formatCurrency(booking.balancePayment) : 'N/A'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                                booking.status || 'UNKNOWN'
                              )}`}
                            >
                              {statusLabels[booking.status as keyof typeof statusLabels] || t('booking.status.unknown')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-center">
                              {bookingId ? (
                                <Link href={`/bookings/${bookingId}`}>
                                  <Button size="sm" variant="ghost">
                                    {t('common.view')}
                                  </Button>
                                </Link>
                              ) : (
                                <Button size="sm" variant="ghost" disabled>
                                  {t('common.view')}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={previousPage}
                disabled={currentPage === 0}
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('common.page')} {currentPage + 1} {t('common.of')} {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
