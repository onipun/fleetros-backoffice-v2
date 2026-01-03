'use client';

import { OutstandingSettlementsDashboard, PaymentSearchFilters } from '@/components/payment';
import { useLocale } from '@/components/providers/locale-provider';
import { TablePageSkeleton } from '@/components/skeletons/page-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentSearch } from '@/hooks/use-payment-search';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { canAcceptPayments, getMerchantStatus } from '@/lib/api/stripe-onboarding';
import { formatDate } from '@/lib/utils';
import { CreditCard, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function PaymentsPage() {
  const { t, formatCurrency, locale } = useLocale();
  const router = useRouter();
  const [loadingPaymentId, setLoadingPaymentId] = useState<number | null>(null);
  const [businessAccountId, setBusinessAccountId] = useState<string | null>(null);
  const [paymentAccountStatus, setPaymentAccountStatus] = useState<{
    hasAccount: boolean;
    isReady: boolean;
    status?: any;
    isLoading: boolean;
  }>({
    hasAccount: false,
    isReady: false,
    isLoading: true,
  });

  // Use payment search hook
  const {
    payments,
    totalPages,
    totalElements,
    currentPage,
    isLoading,
    error,
    search,
    nextPage,
    previousPage,
    refetch,
  } = usePaymentSearch();

  // Check payment account status
  useEffect(() => {
    const checkPaymentAccountStatus = async () => {
      const accountId = localStorage.getItem('businessAccountId');
      setBusinessAccountId(accountId);
      
      if (!accountId) {
        setPaymentAccountStatus({
          hasAccount: false,
          isReady: false,
          isLoading: false,
        });
        return;
      }

      try {
        const [canAccept, status] = await Promise.all([
          canAcceptPayments(),
          getMerchantStatus(),
        ]);
        
        // Check if merchant exists
        if (!status.success || status.error?.includes('Merchant not found')) {
          setPaymentAccountStatus({
            hasAccount: false,
            isReady: false,
            isLoading: false,
          });
          return;
        }
        
        setPaymentAccountStatus({
          hasAccount: true,
          isReady: canAccept,
          status,
          isLoading: false,
        });
      } catch (error: any) {
        console.error('Error checking payment account:', error);
        
        // If merchant not found, treat as no account
        const isMerchantNotFound = error?.message?.includes('Merchant not found') || 
                                   error?.error?.includes('Merchant not found') ||
                                   error?.response?.data?.error?.includes('Merchant not found');
        
        setPaymentAccountStatus({
          hasAccount: !isMerchantNotFound,
          isReady: false,
          isLoading: false,
        });
      }
    };

    checkPaymentAccountStatus();
  }, []);

  const statusLabels = useMemo(
    () => ({
      PENDING: t('payment.status.pending'),
      COMPLETED: t('payment.status.completed'),
      FAILED: t('payment.status.failed'),
      REFUNDED: t('payment.status.refunded'),
      CANCELLED: t('payment.status.cancelled'),
    }),
    [t]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success/20 text-success';
      case 'PENDING':
        return 'bg-warning/20 text-warning';
      case 'FAILED':
        return 'bg-destructive/20 text-destructive';
      case 'REFUNDED':
        return 'bg-info/20 text-info';
      case 'CANCELLED':
        return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const methodIcons = useMemo(
    () => ({
      CREDIT_CARD: '💳',
      DEBIT_CARD: '💳',
      PAYPAL: '🅿️',
      BANK_TRANSFER: '🏦',
      CASH: '💵',
      WRITE_OFF: '✏️',
      OTHER: '💰',
    }),
    []
  );

  const methodLabels = useMemo(
    () => ({
      CREDIT_CARD: t('payment.methods.creditCard'),
      DEBIT_CARD: t('payment.methods.debitCard'),
      PAYPAL: t('payment.methods.paypal'),
      BANK_TRANSFER: t('payment.methods.bankTransfer'),
      CASH: t('payment.methods.cash'),
      WRITE_OFF: t('payment.methods.writeOff'),
      OTHER: t('payment.methods.other'),
    }),
    [t]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('payment.title')}</h1>
          <p className="text-muted-foreground">{t('payment.manage')}</p>
        </div>
      </div>

      {/* Tabs for Payments and Settlements */}
      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="settlements" className="gap-2">
            <FileText className="h-4 w-4" />
            Settlements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          {/* Search Filters */}
          <PaymentSearchFilters onSearch={search} isLoading={isLoading} />

          {/* Payments List */}
          {isLoading ? (
            <TablePageSkeleton rows={8} />
          ) : error ? (
            <Card>
              <ErrorDisplay
                title={t('payment.errorTitle')}
                message={`${t('payment.errorMessage')}${error?.message ? ` (${error.message})` : ''}`.trim()}
                onRetry={() => refetch()}
              />
            </Card>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('payment.noResults')}</p>
            </div>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">{t('payment.table.id')}</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">{t('payment.table.amount')}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">{t('payment.table.method')}</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">{t('payment.table.type')}</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">{t('payment.table.status')}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">{t('payment.table.date')}</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                    {payments.map((payment) => {
                      const methodKey = (payment.paymentMethod ?? 'OTHER') as keyof typeof methodIcons;
                      const methodLabel = methodLabels[methodKey as keyof typeof methodLabels] ?? methodLabels.OTHER;
                      const statusKey = (payment.status ?? '') as keyof typeof statusLabels;
                      const statusLabel = statusLabels[statusKey];

                      return (
                        <tr key={payment.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-mono">#{payment.id || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className="font-medium text-primary">
                              {payment.amount != null ? formatCurrency(payment.amount) : t('common.notAvailable')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span>{methodIcons[methodKey] ?? methodIcons.OTHER}</span>
                              <span className="font-medium">
                                {payment.paymentMethod ? methodLabel : t('common.notAvailable')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {payment.paymentMethod === 'WRITE_OFF' ? (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                  {t('payment.methods.writeOff')}
                                </span>
                              ) : (
                                <>
                                  {payment.isDeposit && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                      Deposit
                                    </span>
                                  )}
                                  {payment.isManual && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                      Manual
                                    </span>
                                  )}
                                  {!payment.isDeposit && !payment.isManual && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                      Online
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                                payment.status || 'UNKNOWN'
                              )}`}
                            >
                              {statusLabel || t('payment.status.unknown')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {payment.paymentDate
                                  ? formatDate(payment.paymentDate, locale).split(',')[0]
                                  : t('common.notAvailable')}
                              </span>
                              {payment.createdAt && (
                                <span className="text-xs text-muted-foreground">
                                  Created: {formatDate(payment.createdAt, locale).split(',')[0]}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={loadingPaymentId === payment.id}
                                onClick={async () => {
                                  // First check if bookingId is directly available
                                  if (payment.bookingId) {
                                    router.push(`/bookings/${payment.bookingId}?tab=payments`);
                                    return;
                                  }

                                  // Try to extract booking ID from HATEOAS links
                                  // The booking link can be a single object or an array
                                  const bookingLinks = payment._links?.booking;
                                  let bookingId: string | null = null;

                                  if (Array.isArray(bookingLinks)) {
                                    // Find the link that contains /bookings/{id} pattern
                                    for (const link of bookingLinks) {
                                      const match = link.href?.match(/\/bookings\/(\d+)/);
                                      if (match) {
                                        bookingId = match[1];
                                        break;
                                      }
                                    }
                                  } else if (bookingLinks?.href) {
                                    // Single link object - try to extract ID or follow the link
                                    const match = bookingLinks.href.match(/\/bookings\/(\d+)/);
                                    if (match) {
                                      bookingId = match[1];
                                    }
                                  }

                                  if (bookingId) {
                                    router.push(`/bookings/${bookingId}?tab=payments`);
                                    return;
                                  }

                                  // If no direct booking ID found, try to follow the relation link
                                  const relationLink = Array.isArray(bookingLinks)
                                    ? bookingLinks.find(l => l.href?.includes('/payments/'))?.href
                                    : bookingLinks?.href;

                                  if (relationLink) {
                                    try {
                                      setLoadingPaymentId(payment.id ?? null);
                                      const booking = await hateoasClient.followLink<{ id?: number }>(relationLink);
                                      if (booking?.id) {
                                        router.push(`/bookings/${booking.id}?tab=payments`);
                                      } else {
                                        alert(`Could not find booking for payment #${payment.id}`);
                                      }
                                    } catch (error) {
                                      console.error('Error fetching booking:', error);
                                      alert(`Error fetching booking details for payment #${payment.id}`);
                                    } finally {
                                      setLoadingPaymentId(null);
                                    }
                                  } else {
                                    alert(`Payment #${payment.id}\nNo booking linked to this payment.`);
                                  }
                                }}
                              >
                                {loadingPaymentId === payment.id ? 'Loading...' : t('common.view')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('common.page')} {currentPage + 1} {t('common.of')} {totalPages} ({totalElements} {t('payment.title').toLowerCase()})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={previousPage}
                  disabled={currentPage === 0}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={currentPage >= totalPages - 1}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
            </>
          )}
        </TabsContent>

        <TabsContent value="settlements" className="space-y-6">
          <OutstandingSettlementsDashboard 
            onViewSettlement={(bookingId) => router.push(`/bookings/${bookingId}?tab=settlement`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
