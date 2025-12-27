'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { cn, formatDateTime } from '@/lib/utils';
import type { Booking, Package as BookingPackage, Offering, Vehicle } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { useReactToPrint } from 'react-to-print';

interface BookingReceiptProps {
  booking: Booking;
  vehicleDetails?: {
    make?: string;
    model?: string;
    year?: number;
    licensePlate?: string;
  };
  packageDetails?: BookingPackage;
  pricingSnapshot?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 w-1.5 rounded-full bg-primary" />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-medium text-foreground text-right', valueClassName)}>
        {value}
      </div>
    </div>
  );
}

export function BookingReceipt({
  booking,
  vehicleDetails: propVehicleDetails,
  packageDetails,
  pricingSnapshot,
  open,
  onOpenChange,
}: BookingReceiptProps) {
  const { t, formatCurrency } = useLocale();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Fetch vehicle details via HATEOAS API
  const { data: vehicleData } = useQuery({
    queryKey: ['vehicle', booking.vehicleId],
    queryFn: () => hateoasClient.getResource<Vehicle>('vehicles', String(booking.vehicleId)),
    enabled: open && !!booking.vehicleId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Use fetched vehicle data or fallback to props
  const vehicleDetails = vehicleData || propVehicleDetails;

    const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Booking-${booking.id}`,
  });

  const offerings = (booking.offerings || []) as Array<{
    offering?: Offering;
    offeringId?: number;
    quantity?: number;
    price?: number;
    totalPrice?: number;
    included?: boolean;
  }>;

  const statusColors: Record<string, string> = {
    PENDING: 'bg-warning/10 text-warning border-warning/20',
    CONFIRMED: 'bg-info/10 text-info border-info/20',
    COMPLETED: 'bg-success/10 text-success border-success/20',
    CANCELLED: 'bg-danger/10 text-danger border-danger/20',
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 no-print">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {t('booking.receipt.title')}
            </DialogTitle>
            <Button onClick={handlePrint} size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              {t('booking.receipt.print')}
            </Button>
          </div>
        </DialogHeader>

        <div ref={receiptRef} className="px-6 pb-6">
          {/* Header */}
          <div className="mb-8 border-b border-border pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-foreground mb-1">
                  {t('booking.receipt.companyName')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('booking.receipt.bookingReceipt')}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center px-3 py-1.5 rounded-md border font-medium text-sm ${getStatusColor(
                    booking.status || 'PENDING'
                  )}`}
                >
                  {t(`booking.status.${(booking.status || 'pending').toLowerCase()}`)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('booking.receipt.generatedOn')}:{' '}
                  {formatDateTime(new Date().toISOString())}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <Card className="border border-border shadow-none mb-6">
            <CardContent className="p-6">
              <SectionTitle title={t('booking.receipt.bookingInformation')} />
              <div className="mt-4 divide-y divide-border">
                <InfoRow
                  label={t('booking.receipt.bookingId')}
                  value={`#${booking.id}`}
                  valueClassName="font-semibold"
                />
                <InfoRow
                  label={t('booking.receipt.bookingDate')}
                  value={
                    booking.createdAt
                      ? formatDateTime(booking.createdAt)
                      : t('common.notAvailable')
                  }
                />
                <InfoRow
                  label={t('booking.receipt.duration')}
                  value={`${booking.totalDays || 0} ${(booking.totalDays || 0) === 1
                    ? t('booking.form.daySingular')
                    : t('booking.form.dayPlural')}`}
                />

                <div className="py-2">
                  <p className="text-sm font-semibold text-foreground">
                    {t('booking.receipt.pickupDetails')}
                  </p>
                </div>
                <InfoRow
                  label={t('booking.receipt.pickupDate')}
                  value={
                    booking.startDate
                      ? formatDateTime(booking.startDate)
                      : t('common.notAvailable')
                  }
                  valueClassName="font-semibold"
                />
                <InfoRow
                  label={t('booking.receipt.pickupLocation')}
                  value={booking.pickupLocation || t('common.notAvailable')}
                />

                <div className="py-2">
                  <p className="text-sm font-semibold text-foreground">
                    {t('booking.receipt.dropoffDetails')}
                  </p>
                </div>
                <InfoRow
                  label={t('booking.receipt.dropoffDate')}
                  value={
                    booking.endDate
                      ? formatDateTime(booking.endDate)
                      : t('common.notAvailable')
                  }
                  valueClassName="font-semibold"
                />
                <InfoRow
                  label={t('booking.receipt.dropoffLocation')}
                  value={booking.dropoffLocation || t('common.notAvailable')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card className="border border-border shadow-none mb-6">
            <CardContent className="p-6">
              <SectionTitle title={t('booking.receipt.customerDetails')} />
              <div className="mt-4 divide-y divide-border">
                {booking.guestName && (
                  <InfoRow label={t('booking.receipt.customerName')} value={booking.guestName} valueClassName="font-semibold" />
                )}
                {booking.guestEmail && (
                  <InfoRow label={t('booking.receipt.customerEmail')} value={booking.guestEmail} />
                )}
                {booking.guestPhone && (
                  <InfoRow label={t('booking.receipt.customerPhone')} value={booking.guestPhone} />
                )}
                {!booking.guestName && !booking.guestEmail && !booking.guestPhone && (
                  <div className="py-3 text-sm text-muted-foreground italic">
                    {t('common.notAvailable')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card className="border border-border shadow-none mb-6">
            <CardContent className="p-6">
              <SectionTitle title={t('booking.receipt.vehicleInformation')} />
              <div className="grid md:grid-cols-2 gap-6">
                <div className="mt-4 divide-y divide-border">
                  <InfoRow label={t('booking.receipt.vehicleId')} value={`#${booking.vehicleId}`} valueClassName="font-semibold" />
                  <InfoRow
                    label={t('booking.receipt.vehicle')}
                    value={
                      vehicleDetails
                        ? `${vehicleDetails.year ?? ''} ${vehicleDetails.make ?? ''} ${vehicleDetails.model ?? ''}`.trim()
                        : t('common.notAvailable')
                    }
                  />
                  <InfoRow
                    label={t('booking.receipt.licensePlate')}
                    value={vehicleDetails?.licensePlate || t('common.notAvailable')}
                  />
                </div>

                <div className="mt-4 divide-y divide-border">
                  <InfoRow
                    label={t('booking.receipt.transmission')}
                    value={vehicleDetails?.transmissionType || t('common.notAvailable')}
                  />
                  <InfoRow
                    label={t('booking.receipt.seaterCount')}
                    value={
                      vehicleDetails?.seaterCount
                        ? `${vehicleDetails.seaterCount} ${t('booking.receipt.seats')}`
                        : t('common.notAvailable')
                    }
                  />
                  <InfoRow
                    label={t('booking.receipt.fuelType')}
                    value={vehicleDetails?.fuelType || t('common.notAvailable')}
                  />
                  <InfoRow
                    label={t('booking.receipt.carType')}
                    value={vehicleDetails?.carType || t('common.notAvailable')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Information */}
          {(booking.packageId || packageDetails) && (
            <Card className="border border-border shadow-none mb-6">
              <CardContent className="p-6">
                <SectionTitle title={t('booking.receipt.packageInformation')} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {packageDetails?.name || `${t('booking.receipt.package')} #${booking.packageId}`}
                    </p>
                    {packageDetails?.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {packageDetails.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {t('booking.receipt.included')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Services */}
          {offerings.length > 0 && (
            <Card className="border border-border shadow-none mb-6">
              <CardContent className="p-6">
                <SectionTitle title={t('booking.receipt.additionalServices')} />
                <div className="space-y-3">
                  {offerings.map((item, index) => {
                    const offering = item.offering || ({} as Offering);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {offering.name || `${t('offering.unnamedOffering')} #${item.offeringId}`}
                            </p>
                            {item.included && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-success/10 text-success border-success/20"
                              >
                                {t('booking.receipt.packageIncluded')}
                              </Badge>
                            )}
                          </div>
                          {offering.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {offering.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-muted-foreground">
                            {item.quantity || 1} × {formatCurrency(item.price || 0)}
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.totalPrice || 0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Breakdown */}
          <Card className="border border-border shadow-none mb-6">
            <CardContent className="p-6">
              <SectionTitle title={t('booking.receipt.pricingBreakdown')} />
              <div className="space-y-1">
                {pricingSnapshot ? (
                  <>
                    {/* Vehicle Rentals */}
                    {pricingSnapshot.pricingSummary?.vehicleRentals?.map((rental: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-sm text-muted-foreground">
                          {rental.vehicleName} ({rental.days} {rental.days === 1 ? 'day' : 'days'} × {formatCurrency(rental.dailyRate)})
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(rental.amount || 0)}
                        </span>
                      </div>
                    ))}

                    {/* Package Adjustments */}
                    {pricingSnapshot.pricingSummary?.packages?.map((pkg: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-sm text-muted-foreground">
                          {pkg.packageName}
                          {pkg.modifierType === 'PERCENTAGE' && ` (${pkg.priceModifier > 0 ? '+' : ''}${pkg.priceModifier}%)`}
                        </span>
                        <span className={`text-sm font-medium ${(pkg.packageAdjustment || pkg.amount) >= 0 ? 'text-foreground' : 'text-success'}`}>
                          {(pkg.packageAdjustment || pkg.amount) >= 0 ? '' : '-'}{formatCurrency(Math.abs(pkg.packageAdjustment || pkg.amount || 0))}
                        </span>
                      </div>
                    ))}

                    {/* Offerings */}
                    {pricingSnapshot.pricingSummary?.offerings?.map((offering: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-sm text-muted-foreground">
                          {offering.offeringName}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(offering.amount || offering.totalPrice || 0)}
                        </span>
                      </div>
                    ))}

                    {/* Subtotal */}
                    <div className="flex justify-between py-1 border-t mt-1 pt-1">
                      <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(pricingSnapshot.subtotal ?? pricingSnapshot.pricingSummary?.subtotal ?? pricingSnapshot.subtotalBeforeDiscount ?? 0)}
                      </span>
                    </div>

                    {/* Discounts */}
                    {pricingSnapshot.pricingSummary?.discounts?.map((discount: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-1 text-success">
                        <span className="text-sm">Discount: {discount.discountCode}</span>
                        <span className="text-sm font-semibold">-{formatCurrency(discount.discountAmount || 0)}</span>
                      </div>
                    ))}

                    {/* Loyalty Discount */}
                    {pricingSnapshot.isLoyaltyRedeemed && pricingSnapshot.loyaltyDiscountAmount > 0 && (
                      <div className="flex justify-between py-1 text-success">
                        <span className="text-sm flex items-center gap-1">
                          🎁 Loyalty Points Discount
                          {pricingSnapshot.loyaltyPointsRedeemed && (
                            <span className="text-xs text-muted-foreground">
                              ({pricingSnapshot.loyaltyPointsRedeemed.toLocaleString()} pts)
                            </span>
                          )}
                        </span>
                        <span className="text-sm font-semibold">-{formatCurrency(pricingSnapshot.loyaltyDiscountAmount)}</span>
                      </div>
                    )}

                    {/* Total Savings */}
                    {(pricingSnapshot.totalDiscount ?? 0) > 0 && (
                      <div className="flex justify-between py-1 text-success">
                        <span className="text-sm font-medium">Total Savings</span>
                        <span className="text-sm font-semibold">-{formatCurrency(pricingSnapshot.totalDiscount)}</span>
                      </div>
                    )}

                    {/* Taxes */}
                    {(pricingSnapshot.taxAmount ?? 0) > 0 && (
                      <div className="flex justify-between py-1 border-t mt-1 pt-1">
                        <span className="text-sm text-muted-foreground">Tax</span>
                        <span className="text-sm font-medium text-foreground">{formatCurrency(pricingSnapshot.taxAmount)}</span>
                      </div>
                    )}

                    {/* Service Fee */}
                    {(pricingSnapshot.serviceFee ?? 0) > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-muted-foreground">Service Fee</span>
                        <span className="text-sm font-medium text-foreground">{formatCurrency(pricingSnapshot.serviceFee)}</span>
                      </div>
                    )}

                    {/* Deposit */}
                    {(pricingSnapshot.totalDeposit ?? 0) > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-muted-foreground">Deposit (Refundable)</span>
                        <span className="text-sm font-medium text-foreground">{formatCurrency(pricingSnapshot.totalDeposit)}</span>
                      </div>
                    )}

                    {/* Grand Total */}
                    <Separator className="my-1" />
                    <div className="flex justify-between items-baseline py-3 bg-muted/30 rounded-md px-4">
                      <span className="text-sm font-semibold text-foreground">Grand Total</span>
                      <span className="text-2xl font-semibold text-primary">
                        {formatCurrency(pricingSnapshot.grandTotal || booking.finalPrice || 0)}
                      </span>
                    </div>

                    {/* Payment Schedule */}
                    {(pricingSnapshot.dueAtBooking || pricingSnapshot.dueAtPickup) && (
                      <div className="space-y-1 mt-3 p-4 bg-muted/30 rounded-md">
                        {pricingSnapshot.dueAtBooking > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Due at Booking</span>
                            <span className="text-sm font-medium text-foreground">
                              {formatCurrency(pricingSnapshot.dueAtBooking)}
                            </span>
                          </div>
                        )}
                        {pricingSnapshot.dueAtPickup > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Due at Pickup</span>
                            <span className="text-sm font-medium text-foreground">
                              {formatCurrency(pricingSnapshot.dueAtPickup)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Balance Due */}
                    <div className="flex justify-between py-3 bg-warning/10 border border-warning/20 rounded-md px-4 mt-3">
                      <span className="text-sm font-semibold text-foreground">
                        {t('booking.receipt.balanceDue')}
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {formatCurrency(booking.balancePayment || 0)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Fallback to simple breakdown if no pricing snapshot */}
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-muted-foreground">
                        {t('booking.receipt.rentalFee')}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(booking.totalRentalFee || 0)}
                      </span>
                    </div>
                    {booking.discountId && (
                      <div className="flex justify-between py-1 text-success">
                        <span className="text-sm">
                          {t('booking.receipt.discount')} (#{booking.discountId})
                        </span>
                        <span className="text-sm font-semibold">
                          -{formatCurrency(
                            (booking.totalRentalFee || 0) - (booking.finalPrice || 0)
                          )}
                        </span>
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex justify-between items-baseline py-3 bg-muted/30 rounded-md px-4">
                      <span className="text-sm font-semibold text-foreground">
                        {t('booking.receipt.totalAmount')}
                      </span>
                      <span className="text-2xl font-semibold text-primary">
                        {formatCurrency(booking.finalPrice || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-warning/10 border border-warning/20 rounded-md px-4 mt-3">
                      <span className="text-sm font-semibold text-foreground">
                        {t('booking.receipt.balanceDue')}
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {formatCurrency(booking.balancePayment || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          {booking.insurancePolicy && (
            <Card className="border border-border shadow-none mb-6">
              <CardContent className="p-6">
                <SectionTitle title={t('booking.receipt.insuranceInformation')} />
                <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">
                  {booking.insurancePolicy}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('booking.receipt.thankYou')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('booking.receipt.questions')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
