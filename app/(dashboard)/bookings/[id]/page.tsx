'use client';

import { CustomCategoryManagement } from '@/components/booking/custom-category-management';
import { BookingImageGallery } from '@/components/booking/image-gallery';
import { ImageUploadDialog } from '@/components/booking/image-upload-dialog';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { formatDateTime } from '@/lib/utils';
import type { Booking, Offering } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Settings, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type BookingOfferingSummary = {
  id?: number;
  name?: string;
  quantity?: number;
  price?: number;
  totalPrice?: number;
};

export default function BookingDetailPage() {
  const { t, formatCurrency } = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false);

  const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => hateoasClient.getResource<Booking>('bookings', bookingId),
  });

  const bookingOfferings = useMemo<BookingOfferingSummary[]>(() => {
    if (!booking?.offerings) return [];

    return booking.offerings.map((item: any) => {
      if (item.offering) {
        return {
          id: item.offering.id ?? item.offeringId,
          name: item.offering.name,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice,
        };
      }

      const offering = item as Offering;
      return {
        id: offering.id,
        name: offering.name,
        quantity: 'quantity' in item ? item.quantity : undefined,
        price: 'price' in item ? item.price : undefined,
        totalPrice: 'totalPrice' in item ? item.totalPrice : undefined,
      };
    });
  }, [booking?.offerings]);

  const deleteBookingMutation = useMutation({
    mutationFn: async () => hateoasClient.delete('bookings', bookingId),
    onSuccess: () => {
      toast({
        title: t('booking.detail.deleteBookingSuccess'),
        description: t('booking.detail.deleteBookingDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.push('/bookings');
    },
    onError: (error: Error) => {
      toast({
        title: t('booking.detail.deleteBookingError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (bookingLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        {t('booking.detail.loading')}
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive">{t('booking.detail.errorLoading')}</p>
        <Button asChild variant="outline">
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('booking.detail.backToBookings')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('booking.detail.title')} #{booking.id ?? bookingId}</h1>
            <p className="text-muted-foreground">{t('booking.detail.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/bookings/${bookingId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              {t('booking.detail.edit')}
            </Link>
          </Button>
          <Button
            variant="destructive"
            disabled={deleteBookingMutation.isPending}
            onClick={() => {
              if (deleteBookingMutation.isPending) return;
              if (confirm(t('booking.detail.deleteConfirm'))) {
                deleteBookingMutation.mutate();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('booking.detail.delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('booking.detail.images.title')}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryManagementOpen(true)}
                  title={t('booking.images.customCategories.title')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t('booking.images.upload.title')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BookingImageGallery bookingId={bookingId} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('booking.detail.sections.reservation')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.vehicleId')}</span>
                <p className="font-medium">{booking.vehicleId ? `#${booking.vehicleId}` : t('common.notAvailable')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.package')}</span>
                <p className="font-medium">{booking.packageId ? `#${booking.packageId}` : t('common.none')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.discount')}</span>
                <p className="font-medium">{booking.discountId ? `#${booking.discountId}` : t('common.none')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.status')}</span>
                <p className="font-medium">{booking.status}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.start')}</span>
                <p className="font-medium">{booking.startDate ? formatDateTime(booking.startDate) : t('common.notAvailable')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.end')}</span>
                <p className="font-medium">{booking.endDate ? formatDateTime(booking.endDate) : t('common.notAvailable')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.pickupLocation')}</span>
                <p className="font-medium">{booking.pickupLocation || t('common.notAvailable')}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.dropoffLocation')}</span>
                <p className="font-medium">{booking.dropoffLocation || t('common.notAvailable')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('booking.detail.sections.financial')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.totalDays')}</span>
                <p className="font-medium">{booking.totalDays ?? 0}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.totalRentalFee')}</span>
                <p className="font-medium">{formatCurrency(booking.totalRentalFee ?? 0)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.finalPrice')}</span>
                <p className="font-medium">{formatCurrency(booking.finalPrice ?? 0)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">{t('booking.detail.fields.balancePayment')}</span>
                <p className="font-medium text-warning">{formatCurrency(booking.balancePayment ?? 0)}</p>
              </div>
              {booking.insurancePolicy && (
                <div className="md:col-span-2">
                  <span className="text-sm text-muted-foreground">{t('booking.detail.fields.insurancePolicy')}</span>
                  <p className="text-sm text-muted-foreground">{booking.insurancePolicy}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('booking.detail.sections.offerings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookingOfferings.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('booking.detail.noOfferings')}</p>
              ) : (
                <div className="space-y-2">
                  {bookingOfferings.map((offering) => (
                    <div
                      key={offering.id ?? offering.name}
                      className="flex flex-wrap items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{offering.name || `${t('offering.unnamedOffering')} #${offering.id}`}</p>
                        {offering.quantity != null && (
                          <p className="text-xs text-muted-foreground">{t('booking.detail.offeringQuantity')} {offering.quantity}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {offering.price != null && (
                          <p>{t('booking.detail.offeringPrice')} {formatCurrency(offering.price)}</p>
                        )}
                        {offering.totalPrice != null && (
                          <p>{t('booking.detail.offeringTotal')} {formatCurrency(offering.totalPrice)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        bookingId={bookingId}
        onUploadSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images-grouped'] });
        }}
      />

      {/* Custom Category Management Dialog */}
      <CustomCategoryManagement
        open={categoryManagementOpen}
        onOpenChange={setCategoryManagementOpen}
      />
    </div>
  );
}
