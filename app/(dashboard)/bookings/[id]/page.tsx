'use client';

import { BookingAuditTrail } from '@/components/booking/booking-audit-trail';
import { BookingModificationDialog } from '@/components/booking/booking-modification-dialog';
import { BookingReceipt } from '@/components/booking/booking-receipt';
import { CustomCategoryManagement } from '@/components/booking/custom-category-management';
import { BookingImageGallery } from '@/components/booking/image-gallery';
import { ImageUploadDialog } from '@/components/booking/image-upload-dialog';
import { ManualPaymentDialog } from '@/components/booking/manual-payment-dialog';
import { PaymentSummaryCard } from '@/components/booking/payment-summary-card';
import { useLocale } from '@/components/providers/locale-provider';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { getSettlementDetails } from '@/lib/api/settlement-api';
import { formatDateTime } from '@/lib/utils';
import type { Booking, Offering } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, CheckCircle2, CreditCard, Edit3, Eye, FileText, History, Settings, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const roundToTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

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
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [categoryManagementOpen, setCategoryManagementOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [modificationDialogOpen, setModificationDialogOpen] = useState(false);
  const [manualPaymentDialogOpen, setManualPaymentDialogOpen] = useState(false);
  const [completeWarningDialogOpen, setCompleteWarningDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['details', 'payments', 'history'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => hateoasClient.getResource<Booking>('bookings', bookingId),
  });

  // Fetch settlement details to check if settlement is open
  const { data: settlement } = useQuery({
    queryKey: ['settlement', bookingId],
    queryFn: () => getSettlementDetails(Number(bookingId)),
    enabled: !!bookingId,
  });

  const isSettlementOpen = settlement?.summary?.isOpen ?? true;

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
      let loyaltySnapshot = null;
      
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
      
      if (data.loyaltySnapshotJson && typeof data.loyaltySnapshotJson === 'string') {
        try {
          loyaltySnapshot = JSON.parse(data.loyaltySnapshotJson);
        } catch (e) {
          console.error('Failed to parse loyaltySnapshotJson:', e);
        }
      }
      
      return {
        ...data,
        pricingSummary,
        detailedSnapshots,
        loyaltySnapshot,
      };
    },
    enabled: !!bookingId,
  });

  // Fetch booking offerings via HATEOAS link
  const { data: bookingOfferingsData } = useQuery({
    queryKey: ['booking', bookingId, 'offerings'],
    queryFn: async () => {
      // First check if we have the HATEOAS link in the booking response
      const bookingOfferingsLink = booking?._links?.bookingOfferings?.href;
      if (!bookingOfferingsLink) {
        return [];
      }

      const token = await fetch('/api/auth/session').then(r => r.json()).then(s => s.accessToken);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(bookingOfferingsLink, {
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch booking offerings');
      }

      const data = await response.json();
      
      // HATEOAS response format: { _embedded: { bookingOfferings: [...] } }
      const offerings = data._embedded?.bookingOfferings || [];
      
      // For each booking offering, we need to fetch the actual offering details
      const offeringsWithDetails = await Promise.all(
        offerings.map(async (bo: any) => {
          // Check if there's an offering link in this bookingOffering
          const offeringLink = bo._links?.offering?.href;
          if (offeringLink) {
            try {
              const offeringRes = await fetch(offeringLink, { headers, cache: 'no-store' });
              if (offeringRes.ok) {
                const offeringData = await offeringRes.json();
                return {
                  id: offeringData.id,
                  name: offeringData.name,
                  quantity: bo.quantity,
                  price: bo.priceAtBooking ?? offeringData.price,
                  totalPrice: bo.totalPrice ?? (bo.quantity * (bo.priceAtBooking ?? offeringData.price)),
                };
              }
            } catch (e) {
              console.error('Failed to fetch offering details:', e);
            }
          }
          
          // Fallback: use data from the bookingOffering itself
          return {
            id: bo.offeringId ?? bo.id,
            name: bo.offeringName ?? `Offering #${bo.offeringId ?? bo.id}`,
            quantity: bo.quantity,
            price: bo.priceAtBooking,
            totalPrice: bo.totalPrice,
          };
        })
      );

      return offeringsWithDetails;
    },
    enabled: !!booking?._links?.bookingOfferings?.href,
  });

  const bookingOfferings = useMemo<BookingOfferingSummary[]>(() => {
    // Use fetched HATEOAS data first
    if (bookingOfferingsData && bookingOfferingsData.length > 0) {
      return bookingOfferingsData;
    }
    
    // Fallback to embedded offerings (legacy support)
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
  }, [bookingOfferingsData, booking?.offerings]);

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

  const deleteBookingMutation = useMutation({
    mutationFn: async () => hateoasClient.delete('bookings', bookingId),
    onSuccess: () => {
      toast({
        title: t('booking.detail.deleteBookingSuccess'),
        description: t('booking.detail.deleteBookingDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-search'] });
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

  const markAsCompletedMutation = useMutation({
    mutationFn: async () => {
      const token = await fetch('/api/auth/session').then(r => r.json()).then(s => s.accessToken);
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update booking status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Booking Completed',
        description: 'The booking has been marked as completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-search'] });
      queryClient.invalidateQueries({ queryKey: ['booking-history', Number(bookingId)] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Complete Booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      const token = await fetch('/api/auth/session').then(r => r.json()).then(s => s.accessToken);
      const response = await fetch(`${API_BASE_URL}/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to cancel booking');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('booking.cancelBookingSuccess'),
        description: t('booking.cancelBookingSuccessDescription'),
      });
      setCancelDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-search'] });
      queryClient.invalidateQueries({ queryKey: ['booking-history', Number(bookingId)] });
    },
    onError: (error: Error) => {
      toast({
        title: t('booking.cancelBookingError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (bookingLoading || isPricingLoading) {
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
          {isSettlementOpen && (
            <Button variant="default" onClick={() => setManualPaymentDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button variant="outline" onClick={() => setReceiptOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            {t('booking.receipt.print')}
          </Button>
          <Button variant="outline" onClick={() => setModificationDialogOpen(true)}>
            <Edit3 className="mr-2 h-4 w-4" />
            Modify Booking
          </Button>
          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              disabled={cancelBookingMutation.isPending}
              onClick={() => setCancelDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('booking.cancelBooking')}
            </Button>
          )}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">
            <Calendar className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-8">
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
                <div className="flex items-center gap-2">
                  <p className="font-medium">{booking.status}</p>
                  {booking.status === 'CONFIRMED' && (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={markAsCompletedMutation.isPending}
                      onClick={() => {
                        const hasPendingBalance = (booking.balancePayment ?? 0) > 0;
                        if (hasPendingBalance) {
                          setCompleteWarningDialogOpen(true);
                        } else {
                          markAsCompletedMutation.mutate();
                        }
                      }}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      {markAsCompletedMutation.isPending ? 'Updating...' : 'Mark as Completed'}
                    </Button>
                  )}
                </div>
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
            <CardContent className="space-y-4">
              {/* Use pricing snapshot data when available, fallback to booking data */}
              {pricingSnapshot ? (
                <div className="space-y-3">
                  {/* Rental Summary */}
                  {pricingSnapshot.pricingSummary?.vehicleRentals?.map((rental: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {rental.vehicleName} ({rental.days} {rental.days === 1 ? 'day' : 'days'} × {formatCurrency(rental.dailyRate)})
                      </span>
                      <span className="font-medium">{formatCurrency(rental.amount)}</span>
                    </div>
                  ))}
                  
                  {/* Offerings */}
                  {pricingSnapshot.pricingSummary?.offerings?.length > 0 && (
                    <>
                      {pricingSnapshot.pricingSummary.offerings.map((offering: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{offering.offeringName}</span>
                          <span className="font-medium">{formatCurrency(offering.amount)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(pricingSnapshot.subtotal ?? pricingSnapshot.pricingSummary?.subtotal ?? 0)}</span>
                    </div>
                  </div>
                  
                  {/* Discounts */}
                  {pricingSnapshot.pricingSummary?.discounts?.length > 0 && (
                    <>
                      {pricingSnapshot.pricingSummary.discounts.map((discount: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm text-green-600">
                          <span>Discount: {discount.discountCode}</span>
                          <span>-{formatCurrency(discount.discountAmount)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* Loyalty Discount */}
                  {pricingSnapshot.isLoyaltyRedeemed && pricingSnapshot.loyaltyDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <span>🎁</span>
                        Loyalty Points Discount
                        {pricingSnapshot.loyaltySnapshot && (
                          <span className="text-xs text-muted-foreground">
                            ({pricingSnapshot.loyaltyPointsRedeemed?.toLocaleString()} pts)
                          </span>
                        )}
                      </span>
                      <span>-{formatCurrency(pricingSnapshot.loyaltyDiscountAmount)}</span>
                    </div>
                  )}
                  
                  {/* Total Discount Summary */}
                  {(pricingSnapshot.totalDiscount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm font-medium text-green-600">
                      <span>Total Savings</span>
                      <span>-{formatCurrency(pricingSnapshot.totalDiscount)}</span>
                    </div>
                  )}
                  
                  {/* Taxes and Fees */}
                  {(pricingSnapshot.taxAmount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">{formatCurrency(pricingSnapshot.taxAmount)}</span>
                    </div>
                  )}
                  
                  {(pricingSnapshot.serviceFee ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span className="font-medium">{formatCurrency(pricingSnapshot.serviceFee)}</span>
                    </div>
                  )}
                  
                  {/* Deposit */}
                  {(pricingSnapshot.totalDeposit ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit (Refundable)</span>
                      <span className="font-medium">{formatCurrency(pricingSnapshot.totalDeposit)}</span>
                    </div>
                  )}
                  
                  {/* Grand Total */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-base font-semibold">
                      <span>Grand Total</span>
                      <span>{formatCurrency(pricingSnapshot.grandTotal)}</span>
                    </div>
                  </div>
                  
                  {/* Payment Schedule */}
                  <div className="rounded-md bg-muted/30 p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due at Booking</span>
                      <span className="font-medium">{formatCurrency(pricingSnapshot.dueAtBooking)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due at Pickup</span>
                      <span className="font-medium">{formatCurrency(pricingSnapshot.dueAtPickup)}</span>
                    </div>
                  </div>
                  
                  {/* Loyalty Info */}
                  {pricingSnapshot.loyaltySnapshot && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 space-y-1">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Loyalty Points Info</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-amber-700 dark:text-amber-300">Tier at Booking</span>
                        <span className="font-medium">{pricingSnapshot.loyaltySnapshot.customerTierAtBooking}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-amber-700 dark:text-amber-300">Points Before</span>
                        <span>{pricingSnapshot.loyaltySnapshot.availablePointsBeforeRedemption?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-amber-700 dark:text-amber-300">Points Redeemed</span>
                        <span className="text-green-600">-{pricingSnapshot.loyaltySnapshot.pointsRedeemed?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-amber-700 dark:text-amber-300">Points After</span>
                        <span>{pricingSnapshot.loyaltySnapshot.availablePointsAfterRedemption?.toLocaleString()}</span>
                      </div>
                      {pricingSnapshot.loyaltySnapshot.redemptionDescription && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          {pricingSnapshot.loyaltySnapshot.redemptionDescription}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Balance Payment Status */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('booking.detail.fields.balancePayment')}</span>
                      {(booking.balancePayment ?? 0) <= 0 ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">Fully Paid</span>
                        </div>
                      ) : (
                        <span className="font-medium text-warning">{formatCurrency(booking.balancePayment ?? 0)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback to booking data when no pricing snapshot */
                <div className="grid gap-4 md:grid-cols-2">
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
                    {(booking.balancePayment ?? 0) <= 0 ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">Fully Paid</span>
                      </div>
                    ) : (
                      <p className="font-medium text-warning">{formatCurrency(booking.balancePayment ?? 0)}</p>
                    )}
                  </div>
                </div>
              )}
              
              {booking.insurancePolicy && (
                <div className="border-t pt-3">
                  <span className="text-sm text-muted-foreground">{t('booking.detail.fields.insurancePolicy')}</span>
                  <p className="text-sm">{booking.insurancePolicy}</p>
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
                      <Link href={`/offerings/${offering.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          {t('common.view')}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentSummaryCard
            bookingId={Number(bookingId)}
            bookingStatus={booking?.status}
            onRecordPayment={() => setManualPaymentDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <BookingAuditTrail bookingId={Number(bookingId)} />
        </TabsContent>
      </Tabs>

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

      {/* Booking Receipt Dialog */}
      <BookingReceipt
        booking={booking}
        pricingSnapshot={pricingSnapshot}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />

      {/* Booking Modification Dialog */}
      <BookingModificationDialog
        booking={booking}
        open={modificationDialogOpen}
        onOpenChange={setModificationDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['bookings-search'] });
        }}
      />

      {/* Manual Payment Dialog */}
      <ManualPaymentDialog
        bookingId={Number(bookingId)}
        bookingTotal={booking.finalPrice ?? 0}
        balanceDue={booking.balancePayment ?? 0}
        bookingStatus={booking.status}
        guestEmail={booking.guestEmail}
        guestName={booking.guestName}
        guestPhone={booking.guestPhone}
        open={manualPaymentDialogOpen}
        onOpenChange={setManualPaymentDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['payment-summary', Number(bookingId)] });
          queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
        }}
      />

      {/* Complete Booking Warning Dialog */}
      <AlertDialog open={completeWarningDialogOpen} onOpenChange={setCompleteWarningDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600">
              ⚠️ {t('booking.detail.completeWarning.title') || 'Pending Balance Warning'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('booking.detail.completeWarning.message') || 'This booking has an outstanding balance that has not been fully paid.'}
              </p>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('booking.detail.fields.balancePayment') || 'Balance Due'}:</span>
                  <span className="text-lg font-bold text-amber-600">
                    {formatCurrency(booking?.balancePayment ?? 0)}
                  </span>
                </div>
              </div>
              <p className="text-sm mt-3">
                {t('booking.detail.completeWarning.confirm') || 'Are you sure you want to mark this booking as completed without full payment?'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel') || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                markAsCompletedMutation.mutate();
                setCompleteWarningDialogOpen(false);
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t('booking.detail.completeWarning.proceed') || 'Complete Anyway'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Booking Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-600">
              ⚠️ {t('booking.cancelBooking')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium">
                {t('booking.cancelBookingConfirm')}
              </p>
              
              {booking?.balancePayment && booking.balancePayment > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                        Balance Payment: {formatCurrency(booking.balancePayment)}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {t('booking.cancelBookingNote')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground italic">
                {t('booking.cancelBookingWarning')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelBookingMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              disabled={cancelBookingMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                cancelBookingMutation.mutate();
              }}
            >
              {cancelBookingMutation.isPending ? t('common.loading') : t('booking.cancelBookingProceed')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
