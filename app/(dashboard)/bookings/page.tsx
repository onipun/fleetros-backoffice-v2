'use client';

import { BookingSearchFilters } from '@/components/booking/booking-search-filters';
import { useLocale } from '@/components/providers/locale-provider';
import { TablePageSkeleton } from '@/components/skeletons/page-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useBookingSearch } from '@/hooks/use-booking-search';
import { formatDate } from '@/lib/utils';
import { Calendar, Car, CheckCircle2, Clock, Mail, MapPin, Plus, User } from 'lucide-react';
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
          <div className="space-y-3">
            {bookings.map((booking) => {
              const selfLink = booking._links?.self?.href;
              const bookingId = booking.id ?? (selfLink ? selfLink.split('/').pop() : undefined);
              const isFullyPaid = booking.balancePayment != null && booking.balancePayment <= 0;

              return (
                <Card key={booking.id ?? selfLink} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Left: Booking ID, Status & Customer */}
                      <div className="flex items-center gap-4 lg:w-[280px] lg:flex-shrink-0">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              #{booking.id || 'N/A'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                booking.status || 'UNKNOWN'
                              )}`}
                            >
                              {statusLabels[booking.status as keyof typeof statusLabels] || t('booking.status.unknown')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[150px]">{booking.guestName || t('common.notAvailable')}</span>
                          </div>
                          {booking.guestEmail && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{booking.guestEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Center: Vehicle, Dates & Location */}
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Vehicle</p>
                            <p className="font-medium">#{booking.vehicleId || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Dates</p>
                            <p className="font-medium">
                              {booking.startDate ? formatDate(booking.startDate, locale).split(',')[0] : 'N/A'}
                              {booking.endDate && ` - ${formatDate(booking.endDate, locale).split(',')[0]}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-medium">{booking.totalDays || 0} {t('booking.daysSuffix')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Pickup</p>
                            <p className="font-medium truncate">{booking.pickupLocation || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Actions */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 lg:w-[260px] lg:flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0">
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {booking.finalPrice != null ? formatCurrency(booking.finalPrice) : t('common.notAvailable')}
                          </p>
                          {isFullyPaid ? (
                            <div className="flex items-center justify-end gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Fully Paid</span>
                            </div>
                          ) : (
                            <p className="text-sm text-orange-600 font-medium">
                              Due: {booking.balancePayment != null ? formatCurrency(booking.balancePayment) : 'N/A'}
                            </p>
                          )}
                        </div>
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
