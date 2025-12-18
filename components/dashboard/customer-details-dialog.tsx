'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CustomerDetails, CustomerSpendingSummary, fetchCustomerDetails } from '@/lib/api/customer-spending-search';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    AlertCircle,
    Calendar,
    DollarSign,
    Loader2,
    Mail,
    MapPin,
    Phone,
    User
} from 'lucide-react';

interface CustomerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: CustomerSpendingSummary | null;
}

/**
 * Customer Details Dialog Component
 * 
 * Displays detailed customer information by following the HATEOAS customer link.
 * Shows customer contact info and spending summary.
 */
export function CustomerDetailsDialog({
  open,
  onOpenChange,
  summary,
}: CustomerDetailsDialogProps) {
  const { t, locale } = useLocale();

  // Get the customer link from the summary
  const customerLink = summary?._links?.customer?.href;

  // Fetch customer details when dialog opens
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer-details', customerLink],
    queryFn: () => fetchCustomerDetails(customerLink!),
    enabled: open && !!customerLink,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  /**
   * Format currency with locale
   */
  const formatAmount = (amount: number, currency: string = 'MYR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Format date with locale
   */
  const formatDate = (date: string | undefined) => {
    if (!date) return '—';
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    } catch {
      return '—';
    }
  };

  /**
   * Get customer display name
   */
  const getCustomerName = (customer: CustomerDetails) => {
    if (customer.name) return customer.name;
    if (customer.firstName || customer.lastName) {
      return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('customerSpending.customerDetails') || 'Customer Details'}
          </DialogTitle>
          <DialogDescription>
            {t('customerSpending.customerDetailsDescription') || 'View customer information and spending summary'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-destructive mb-4" />
            <p className="text-destructive font-medium">{t('common.error') || 'Error'}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {error instanceof Error ? error.message : t('customerSpending.failedToLoad') || 'Failed to load customer details'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => onOpenChange(false)}
            >
              {t('common.close') || 'Close'}
            </Button>
          </div>
        ) : customer ? (
          <div className="space-y-6">
            {/* Customer Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('customerSpending.contactInfo') || 'Contact Information'}
              </h4>
              
              <div className="space-y-3">
                {/* Name */}
                {getCustomerName(customer) && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getCustomerName(customer)}</span>
                  </div>
                )}

                {/* Email */}
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${customer.email}`} 
                      className="text-primary hover:underline"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}

                {/* Phone */}
                {(customer.phone || customer.phoneNumber) && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${customer.phone || customer.phoneNumber}`}
                      className="hover:underline"
                    >
                      {customer.phone || customer.phoneNumber}
                    </a>
                  </div>
                )}

                {/* Address */}
                {(customer.address || customer.city || customer.country) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {customer.address && <div>{customer.address}</div>}
                      {(customer.city || customer.state || customer.postalCode) && (
                        <div>
                          {[customer.city, customer.state, customer.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                      {customer.country && <div>{customer.country}</div>}
                    </div>
                  </div>
                )}

                {/* Customer Since */}
                {customer.createdAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t('customerSpending.customerSince') || 'Customer since'}: {formatDate(customer.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Spending Summary Section */}
            {summary && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('customerSpending.spendingSummary') || 'Spending Summary'}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Total Spend */}
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {t('customerSpending.totalSpend') || 'Total Spend'}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {formatAmount(summary.totalSpendLifetime, summary.currency)}
                    </p>
                  </div>

                  {/* Total Paid */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {t('customerSpending.totalPaid') || 'Total Paid'}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {formatAmount(summary.totalPaid, summary.currency)}
                    </p>
                  </div>

                  {/* Balance Due */}
                  {summary.totalBalancePayment > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {t('customerSpending.balanceDue') || 'Balance Due'}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                        {formatAmount(summary.totalBalancePayment, summary.currency)}
                      </p>
                    </div>
                  )}

                  {/* Bookings */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {t('customerSpending.bookings') || 'Bookings'}
                      </span>
                    </div>
                    <p className="text-lg font-bold">{summary.totalBookings}</p>
                    <div className="flex gap-1 mt-1">
                      {summary.completedBookings > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                          {summary.completedBookings} {t('customerSpending.completed') || 'completed'}
                        </Badge>
                      )}
                      {summary.activeBookings > 0 && (
                        <Badge variant="default" className="bg-blue-500 text-xs">
                          {summary.activeBookings} {t('customerSpending.active') || 'active'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Dates */}
                <div className="text-sm text-muted-foreground space-y-1">
                  {summary.firstBookingDate && (
                    <p>
                      <span className="font-medium">{t('customerSpending.firstBooking') || 'First Booking'}:</span>{' '}
                      {formatDate(summary.firstBookingDate)}
                    </p>
                  )}
                  {summary.lastActivityDate && (
                    <p>
                      <span className="font-medium">{t('customerSpending.lastActivity') || 'Last Activity'}:</span>{' '}
                      {formatDate(summary.lastActivityDate)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : !customerLink ? (
          <div className="flex flex-col items-center justify-center py-8">
            <User className="h-8 w-8 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {t('customerSpending.noCustomerLink') || 'Customer details not available'}
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default CustomerDetailsDialog;
