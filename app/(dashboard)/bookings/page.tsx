'use client';

import { BookingSearchFilters } from '@/components/booking/booking-search-filters';
import { useLocale } from '@/components/providers/locale-provider';
import { TablePageSkeleton } from '@/components/skeletons/page-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useBookingSearch } from '@/hooks/use-booking-search';
import { formatDate } from '@/lib/utils';
import { Calendar, Mail, Plus, User } from 'lucide-react';
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
          <div className="space-y-4">
            {bookings.map((booking) => {
              const selfLink = booking._links?.self?.href;
              const bookingId = booking.id ?? (selfLink ? selfLink.split('/').pop() : undefined);

              return (
                <Card key={booking.id ?? selfLink} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 bg-muted/30 border-b">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold">
                          {t('booking.bookingLabel')} #{booking.id || t('common.notAvailable')}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            booking.status || 'UNKNOWN'
                          )}`}
                        >
                          {statusLabels[booking.status as keyof typeof statusLabels] || t('booking.status.unknown')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {bookingId ? (
                          <Button size="sm" asChild>
                            <Link href={`/bookings/${bookingId}`}>
                              {t('common.viewDetails')}
                            </Link>
                          </Button>
                        ) : (
                          <Button size="sm" disabled>
                            {t('common.viewDetails')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Body Section */}
                    <div className="p-4 sm:p-6 space-y-4">
                      {/* Customer Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{t('booking.customerNameLabel')}</p>
                            <p className="font-medium truncate">{booking.guestName || t('common.notAvailable')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{t('booking.customerEmailLabel')}</p>
                            <p className="font-medium truncate">{booking.guestEmail || t('common.notAvailable')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t('booking.vehicleIdLabel')}</p>
                          <p className="font-medium">#{booking.vehicleId || t('common.notAvailable')}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{t('booking.startLabel')}</p>
                            <p className="font-medium truncate">
                              {booking.startDate ? formatDate(booking.startDate, locale) : t('common.notAvailable')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{t('booking.endLabel')}</p>
                            <p className="font-medium truncate">
                              {booking.endDate ? formatDate(booking.endDate, locale) : t('common.notAvailable')}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t('booking.durationLabel')}</p>
                          <p className="font-medium">{booking.totalDays || 0} {t('booking.daysSuffix')}</p>
                        </div>
                      </div>

                      {/* Location Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t('booking.pickupLabel')}</p>
                          <p className="font-medium">{booking.pickupLocation || t('common.notAvailable')}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t('booking.dropoffLabel')}</p>
                          <p className="font-medium">{booking.dropoffLocation || t('common.notAvailable')}</p>
                        </div>
                      </div>

                      {/* Pricing Section */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t('booking.finalPriceLabel')}</p>
                          <p className="font-bold text-2xl">
                            {booking.finalPrice != null ? formatCurrency(booking.finalPrice) : t('common.notAvailable')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t('booking.balanceDueLabel')}</p>
                          <p className="font-semibold text-lg text-warning">
                            {booking.balancePayment != null ? formatCurrency(booking.balancePayment) : t('common.notAvailable')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

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
