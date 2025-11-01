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
import { formatDateTime } from '@/lib/utils';
import type { Booking, Package as BookingPackage, Offering } from '@/types';
import { Printer, X } from 'lucide-react';
import { useRef } from 'react';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingReceipt({
  booking,
  vehicleDetails,
  packageDetails,
  open,
  onOpenChange,
}: BookingReceiptProps) {
  const { t, formatCurrency } = useLocale();
  const receiptRef = useRef<HTMLDivElement>(null);

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
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    CANCELLED: 'bg-red-100 text-red-800 border-red-300',
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
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                {t('booking.receipt.print')}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div ref={receiptRef} className="px-6 pb-6">
          {/* Header */}
          <div className="mb-8 border-b-2 border-gray-300 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {t('booking.receipt.companyName')}
                </h1>
                <p className="text-sm text-gray-600">
                  {t('booking.receipt.bookingReceipt')}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex px-4 py-2 rounded-lg border-2 font-semibold text-sm ${getStatusColor(
                    booking.status || 'PENDING'
                  )}`}
                >
                  {t(`booking.status.${(booking.status || 'pending').toLowerCase()}`)}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('booking.receipt.generatedOn')}:{' '}
                  {formatDateTime(new Date().toISOString())}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="h-8 w-1 bg-primary rounded-full"></span>
                  {t('booking.receipt.bookingInformation')}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">
                      {t('booking.receipt.bookingId')}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      #{booking.id}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">
                      {t('booking.receipt.bookingDate')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {booking.createdAt
                        ? formatDateTime(booking.createdAt)
                        : t('common.notAvailable')}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">
                      {t('booking.receipt.duration')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {booking.totalDays || 0}{' '}
                      {(booking.totalDays || 0) === 1
                        ? t('booking.form.daySingular')
                        : t('booking.form.dayPlural')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="h-8 w-1 bg-primary rounded-full"></span>
                  {t('booking.receipt.vehicleInformation')}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 font-medium">
                      {t('booking.receipt.vehicleId')}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      #{booking.vehicleId}
                    </span>
                  </div>
                  {vehicleDetails && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 font-medium">
                          {t('booking.receipt.vehicle')}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {vehicleDetails.year} {vehicleDetails.make}{' '}
                          {vehicleDetails.model}
                        </span>
                      </div>
                      {vehicleDetails.licensePlate && (
                        <>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 font-medium">
                              {t('booking.receipt.licensePlate')}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {vehicleDetails.licensePlate}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rental Period */}
          <Card className="border-2 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="h-8 w-1 bg-primary rounded-full"></span>
                {t('booking.receipt.rentalPeriod')}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                      {t('booking.receipt.pickupDetails')}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {booking.startDate
                        ? formatDateTime(booking.startDate)
                        : t('common.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      📍 {booking.pickupLocation || t('common.notAvailable')}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-1">
                      {t('booking.receipt.dropoffDetails')}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {booking.endDate
                        ? formatDateTime(booking.endDate)
                        : t('common.notAvailable')}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      📍 {booking.dropoffLocation || t('common.notAvailable')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Information */}
          {(booking.packageId || packageDetails) && (
            <Card className="border-2 mb-8 bg-blue-50/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="h-8 w-1 bg-blue-600 rounded-full"></span>
                  {t('booking.receipt.packageInformation')}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {packageDetails?.name || `${t('booking.receipt.package')} #${booking.packageId}`}
                    </p>
                    {packageDetails?.description && (
                      <p className="text-sm text-gray-600 mt-1">
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
            <Card className="border-2 mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="h-8 w-1 bg-primary rounded-full"></span>
                  {t('booking.receipt.additionalServices')}
                </h3>
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
                            <p className="text-sm font-semibold text-gray-900">
                              {offering.name || `${t('offering.unnamedOffering')} #${item.offeringId}`}
                            </p>
                            {item.included && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-50 text-green-700 border-green-300"
                              >
                                {t('booking.receipt.packageIncluded')}
                              </Badge>
                            )}
                          </div>
                          {offering.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {offering.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-600">
                            {item.quantity || 1} × {formatCurrency(item.price || 0)}
                          </p>
                          <p className="text-sm font-bold text-gray-900">
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
          <Card className="border-2 mb-8 bg-gray-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="h-8 w-1 bg-primary rounded-full"></span>
                {t('booking.receipt.pricingBreakdown')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-700">
                    {t('booking.receipt.rentalFee')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(booking.totalRentalFee || 0)}
                  </span>
                </div>
                {booking.discountId && (
                  <div className="flex justify-between py-2 text-green-700">
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
                <Separator className="my-2" />
                <div className="flex justify-between py-2 bg-white rounded-lg px-4">
                  <span className="text-base font-bold text-gray-900">
                    {t('booking.receipt.totalAmount')}
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(booking.finalPrice || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4">
                  <span className="text-sm font-semibold text-yellow-900">
                    {t('booking.receipt.balanceDue')}
                  </span>
                  <span className="text-base font-bold text-yellow-900">
                    {formatCurrency(booking.balancePayment || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          {booking.insurancePolicy && (
            <Card className="border-2 mb-8 bg-indigo-50/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="h-8 w-1 bg-indigo-600 rounded-full"></span>
                  {t('booking.receipt.insuranceInformation')}
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {booking.insurancePolicy}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-gray-300">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {t('booking.receipt.thankYou')}
              </p>
              <p className="text-xs text-gray-500">
                {t('booking.receipt.questions')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
