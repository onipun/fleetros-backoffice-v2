'use client';

import { BookingForm, type BookingFormSubmission } from '@/components/booking/booking-form';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Booking } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

const roundToTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;
  const { t } = useLocale();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => hateoasClient.getResource<Booking>('bookings', bookingId),
  });

  // Fetch applied pricing snapshot
  const { data: pricingSnapshot, isLoading: isPricingLoading } = useQuery({
    queryKey: ['booking', bookingId, 'pricing-snapshot'],
    queryFn: async () => {
      const token = await fetch('/api/auth/session').then(r => r.json()).then(s => s.accessToken);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/pricing-snapshot`, {
        headers,
        cache: 'no-store',
      });
      
      if (!response.ok) {
        // If pricing snapshot doesn't exist, return null
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch pricing snapshot');
      }
      
      const data = await response.json();
      
      // Parse JSON strings in the pricing snapshot response
      let pricingSummary = null;
      let detailedSnapshots = null;
      
      if (data.pricingSummaryJson && typeof data.pricingSummaryJson === 'string') {
        try {
          pricingSummary = JSON.parse(data.pricingSummaryJson);
        } catch (e) {
          console.error('Failed to parse pricingSummaryJson:', e);
        }
      }
      
      if (data.detailedSnapshotsJson && typeof data.detailedSnapshotsJson === 'string') {
        try {
          detailedSnapshots = JSON.parse(data.detailedSnapshotsJson);
        } catch (e) {
          console.error('Failed to parse detailedSnapshotsJson:', e);
        }
      }
      
      return {
        ...data,
        pricingSummary,
        detailedSnapshots,
      };
    },
    enabled: !!bookingId,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: BookingFormSubmission) => {
      const normalizedPayload = {
        ...payload,
        packageId: payload.packageId ?? undefined,
        discountId: payload.discountId ?? undefined,
      };

      return hateoasClient.update<Booking>('bookings', bookingId, normalizedPayload);
    },
    onSuccess: (updated: Booking) => {
      toast({
        title: t('booking.form.notifications.updateSuccessTitle'),
        description: t('booking.form.notifications.updateSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      router.push(`/bookings/${bookingId}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('booking.form.notifications.updateErrorTitle'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Compute pricing line items from pricing snapshot
  const pricingLineItems = useMemo(() => {
    const items: Array<{ id: string; label: string; amount: number; helper?: string }> = [];

    if (!pricingSnapshot?.pricingSummary) return items;

    const summary = pricingSnapshot.pricingSummary;

    // Vehicle rentals
    if (summary.vehicleRentals) {
      summary.vehicleRentals.forEach((rental: any, index: number) => {
        items.push({
          id: `vehicle-rental-${index}`,
          label: `Vehicle: ${rental.vehicleName}`,
          amount: roundToTwo(rental.amount),
          helper: `${rental.days} ${rental.days === 1 ? 'day' : 'days'} × ${formatCurrency(rental.dailyRate)}/day`,
        });
      });
    }

    // Package discount
    if (summary.packageSummary && summary.packageDiscountAmount > 0) {
      items.push({
        id: 'package-discount',
        label: `Package: ${summary.packageSummary.packageName}`,
        amount: -roundToTwo(summary.packageDiscountAmount),
        helper: `${summary.packageSummary.discountPercentage}% discount`,
      });
    }

    // Offerings
    if (summary.offerings) {
      summary.offerings.forEach((offering: any, index: number) => {
        items.push({
          id: `offering-${index}`,
          label: offering.offeringName,
          amount: roundToTwo(offering.amount),
          helper: offering.quantity > 1 ? `${offering.quantity} × ${formatCurrency(offering.unitPrice)}` : undefined,
        });
      });
    }

    // Discounts
    if (summary.discounts) {
      summary.discounts.forEach((discount: any, index: number) => {
        items.push({
          id: `discount-${index}`,
          label: `Discount: ${discount.discountCode}`,
          amount: -roundToTwo(discount.discountAmount),
          helper: discount.description,
        });
      });
    }

    return items;
  }, [pricingSnapshot, t]);

  // Get summary data from pricing snapshot
  const pricingSummary = useMemo(() => {
    if (!pricingSnapshot?.pricingSummary) return null;
    return pricingSnapshot.pricingSummary;
  }, [pricingSnapshot]);

  const handleSubmit = (values: BookingFormSubmission) => {
    updateMutation.mutate(values);
  };

  if (isLoading || isPricingLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {t('booking.form.loading')}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive">{t('booking.form.notFound')}</p>
        <Button asChild variant="outline">
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('booking.form.backToList')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/bookings/${bookingId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('booking.form.pageTitle.edit')}</h1>
          <p className="text-muted-foreground">{t('booking.form.pageSubtitle.edit')}</p>
        </div>
      </div>

      {/* Applied Pricing Overview */}
      {pricingSnapshot && pricingLineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('booking.form.summary.appliedPricing')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(booking?.startDate || '').toLocaleDateString('en-MY', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' → '}
                {new Date(booking?.endDate || '').toLocaleDateString('en-MY', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Duration */}
            {pricingSummary?.vehicleRentals?.[0] && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('booking.form.summary.duration')}:</span>
                <span className="font-medium">
                  {pricingSummary.vehicleRentals[0].days} {pricingSummary.vehicleRentals[0].days === 1 ? t('booking.form.daySingular') : t('booking.form.dayPlural')}
                </span>
              </div>
            )}

            {/* Bill Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{t('booking.form.summary.billDetails')}</h4>
              <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                {pricingLineItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      {item.helper && (
                        <p className="text-xs text-muted-foreground">{item.helper}</p>
                      )}
                    </div>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            {pricingSummary && (
              <div className="space-y-1 rounded-md bg-muted/20 p-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t('booking.form.summary.subtotal')}</span>
                  <span>{formatCurrency(pricingSummary.subtotal)}</span>
                </div>
                {pricingSummary.totalDepositAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t('booking.form.summary.deposit')}</span>
                    <span>{formatCurrency(pricingSummary.totalDepositAmount)}</span>
                  </div>
                )}
                {pricingSummary.totalDiscountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>Total Savings</span>
                    <span>-{formatCurrency(pricingSummary.totalDiscountAmount)}</span>
                  </div>
                )}
                {pricingSummary.taxAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Tax ({((pricingSummary.taxAmount / pricingSummary.subtotal) * 100).toFixed(0)}%)</span>
                    <span>{formatCurrency(pricingSummary.taxAmount)}</span>
                  </div>
                )}
                {pricingSummary.serviceFeeAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Service Fee</span>
                    <span>{formatCurrency(pricingSummary.serviceFeeAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-semibold pt-2 border-t">
                  <span>{t('booking.form.summary.total')}</span>
                  <span>{formatCurrency(pricingSummary.grandTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Due at Booking</span>
                  <span className="font-medium">{formatCurrency(pricingSummary.dueAtBooking)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Due at Pickup</span>
                  <span className="font-medium">{formatCurrency(pricingSummary.dueAtPickup)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <BookingForm
        initialValues={booking}
        submitLabel={t('booking.form.submit.update')}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        onCancel={() => router.push(`/bookings/${bookingId}`)}
        hidePricingCard={true}
      />
    </div>
  );
}
