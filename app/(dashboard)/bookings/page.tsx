'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { TablePageSkeleton } from '@/components/skeletons/page-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/api/hooks';
import { formatDate, parseHalResource } from '@/lib/utils';
import type { Booking } from '@/types';
import { Calendar, Download, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function BookingsPage() {
  const { t, formatCurrency, locale } = useLocale();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error, refetch } = useCollection<Booking>('bookings', {
    page,
    size: 20,
    sort: 'startDate,desc',
  });

  const bookings = data ? parseHalResource<Booking>(data, 'bookings') : [];
  const totalPages = data?.page?.totalPages || 0;

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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('booking.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('booking.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('common.allStatuses')}</option>
              <option value="PENDING">{statusLabels.PENDING}</option>
              <option value="CONFIRMED">{statusLabels.CONFIRMED}</option>
              <option value="COMPLETED">{statusLabels.COMPLETED}</option>
              <option value="CANCELLED">{statusLabels.CANCELLED}</option>
            </select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {t('common.exportCSV')}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <Card key={booking.id ?? selfLink} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {t('booking.bookingLabel')} #{booking.id || t('common.notAvailable')}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                            booking.status || 'UNKNOWN'
                          )}`}
                        >
                          {statusLabels[booking.status as keyof typeof statusLabels] || t('booking.status.unknown')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('booking.bookingIdLabel')}</span>
                          <p className="font-medium">#{booking.id || t('common.notAvailable')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('booking.vehicleIdLabel')}</span>
                          <p className="font-medium">#{booking.vehicleId || t('common.notAvailable')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">{t('booking.startLabel')}</span>
                            <p className="font-medium">
                              {booking.startDate ? formatDate(booking.startDate, locale) : t('common.notAvailable')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">{t('booking.endLabel')}</span>
                            <p className="font-medium">
                              {booking.endDate ? formatDate(booking.endDate, locale) : t('common.notAvailable')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('booking.pickupLabel')}</span>
                          <p className="font-medium">{booking.pickupLocation || t('common.notAvailable')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('booking.dropoffLabel')}</span>
                          <p className="font-medium">{booking.dropoffLocation || t('common.notAvailable')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('booking.durationLabel')}</span>
                          <p className="font-medium">{booking.totalDays || 0} {t('booking.daysSuffix')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('booking.finalPriceLabel')}</span>
                          <p className="font-bold text-lg">
                            {booking.finalPrice != null ? formatCurrency(booking.finalPrice) : t('common.notAvailable')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('booking.balanceDueLabel')}</span>
                          <p className="font-medium text-warning">
                            {booking.balancePayment != null ? formatCurrency(booking.balancePayment) : t('common.notAvailable')}
                          </p>
                        </div>
                      </div>
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
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('common.page')} {page + 1} {t('common.of')} {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
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
