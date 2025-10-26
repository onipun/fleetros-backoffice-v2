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
  const { data: appliedPricing, isLoading: isPricingLoading } = useQuery({
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
      
      return response.json();
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

  // Compute pricing line items from applied pricing snapshot
  const pricingLineItems = useMemo(() => {
    const items: Array<{ id: string; label: string; amount: number; helper?: string }> = [];

    if (appliedPricing && (appliedPricing as any).applicablePricings) {
      const pricings = (appliedPricing as any).applicablePricings;
      
      pricings.forEach((pricing: any, index: number) => {
        if (pricing.rateType && pricing.applicableUnits > 0) {
          const isHourly = pricing.rateType === 'HOURLY';
          const unitText = isHourly 
            ? `${pricing.applicableUnits} ${pricing.applicableUnits === 1 ? 'hour' : 'hours'}`
            : `${pricing.applicableUnits} ${pricing.applicableUnits === 1 ? t('booking.form.daySingular') : t('booking.form.dayPlural')}`;
          
          const rateLabel = pricing.category || pricing.rateType;
          
          items.push({
            id: `vehicle-pricing-${index}`,
            label: `Vehicle Rate [${rateLabel}]`,
            amount: roundToTwo(pricing.lineTotal),
            helper: `${unitText} × ${formatCurrency(pricing.rate)}${isHourly ? '/hr' : '/day'}`,
          });
        }
      });
    }

    return items;
  }, [appliedPricing, t]);

  // Get analysis data from applied pricing
  const pricingAnalysis = useMemo(() => {
    if (appliedPricing && (appliedPricing as any).analysis) {
      return (appliedPricing as any).analysis;
    }
    return null;
  }, [appliedPricing]);

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
      {appliedPricing && pricingLineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('booking.form.summary.appliedPricing')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            {pricingAnalysis && (
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
            )}

            {/* Duration */}
            {pricingAnalysis && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('booking.form.summary.duration')}:</span>
                <span className="font-medium">
                  {pricingAnalysis.totalFullDays > 0 && (
                    <>
                      {pricingAnalysis.totalFullDays} {pricingAnalysis.totalFullDays === 1 ? t('booking.form.daySingular') : t('booking.form.dayPlural')}
                    </>
                  )}
                  {pricingAnalysis.totalFullDays > 0 && pricingAnalysis.totalPartialHours > 0 && ', '}
                  {pricingAnalysis.totalPartialHours > 0 && (
                    <>
                      {pricingAnalysis.totalPartialHours} {pricingAnalysis.totalPartialHours === 1 ? 'hour' : 'hours'}
                    </>
                  )}
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
            {pricingAnalysis && (
              <div className="space-y-1 rounded-md bg-muted/20 p-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t('booking.form.summary.subtotal')}</span>
                  <span>{formatCurrency(pricingAnalysis.subtotal)}</span>
                </div>
                {pricingAnalysis.depositAmount > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t('booking.form.summary.deposit')}</span>
                    <span>{formatCurrency(pricingAnalysis.depositAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>{t('booking.form.summary.total')}</span>
                  <span>{formatCurrency(pricingAnalysis.totalAmount)}</span>
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
      />
    </div>
  );
}
