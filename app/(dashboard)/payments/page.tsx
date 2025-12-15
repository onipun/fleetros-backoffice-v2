'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { TablePageSkeleton } from '@/components/skeletons/page-skeletons';
import { OnboardingStatusBadge } from '@/components/stripe-onboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/api/hooks';
import { canAcceptPayments, getMerchantStatus } from '@/lib/api/stripe-onboarding';
import { formatDate, parseHalResource } from '@/lib/utils';
import type { Payment } from '@/types';
import { AlertCircle, ArrowRight, Banknote, CheckCircle2, CreditCard, Download, Search, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function PaymentsPage() {
  const { t, formatCurrency, locale } = useLocale();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
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

  const { data, isLoading, error, refetch } = useCollection<Payment>('payments', {
    page,
    size: 20,
    sort: 'createdAt,desc',
  });

  const payments = data ? parseHalResource<Payment>(data, 'payments') : [];
  const totalPages = data?.page?.totalPages || 0;

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
        
        setPaymentAccountStatus({
          hasAccount: true,
          isReady: canAccept,
          status,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error checking payment account:', error);
        setPaymentAccountStatus({
          hasAccount: true,
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

      {/* Payment Account Status Section */}
      {!paymentAccountStatus.isLoading && (
        <Card className={
          paymentAccountStatus.isReady 
            ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
            : paymentAccountStatus.hasAccount 
            ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
            : 'border-primary/20 bg-primary/5'
        }>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-full ${
                  paymentAccountStatus.isReady 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : paymentAccountStatus.hasAccount
                    ? 'bg-yellow-100 dark:bg-yellow-900'
                    : 'bg-primary/10'
                }`}>
                  {paymentAccountStatus.isReady ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : paymentAccountStatus.hasAccount ? (
                    <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <Settings className="h-6 w-6 text-primary" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {paymentAccountStatus.isReady 
                        ? 'Payment Account Active' 
                        : paymentAccountStatus.hasAccount
                        ? 'Payment Account Setup In Progress'
                        : 'Setup Payment Account'}
                    </h3>
                    {paymentAccountStatus.status && (
                      <OnboardingStatusBadge
                        onboardingStatus={paymentAccountStatus.status.onboardingStatus}
                        chargesEnabled={paymentAccountStatus.status.chargesEnabled}
                      />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {paymentAccountStatus.isReady 
                      ? 'Your payment account is fully verified and ready to accept payments from customers.'
                      : paymentAccountStatus.hasAccount
                      ? 'Complete your payment account verification to start accepting payments.'
                      : 'Enable payment processing by setting up your merchant account with Stripe.'}
                  </p>

                  {paymentAccountStatus.isReady && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Accept Payments
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Receive Payouts
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Process Refunds
                      </span>
                    </div>
                  )}

                  {paymentAccountStatus.hasAccount && !paymentAccountStatus.isReady && 
                   paymentAccountStatus.status?.requirementsCurrentlyDue?.length > 0 && (
                    <div className="mt-2 p-3 rounded-md bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                        Action Required:
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {paymentAccountStatus.status.requirementsCurrentlyDue.length} item(s) need attention
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => router.push(
                  paymentAccountStatus.hasAccount 
                    ? '/settings/payment-account' 
                    : '/payments/onboarding'
                )}
                variant={paymentAccountStatus.isReady ? 'outline' : 'default'}
              >
                {paymentAccountStatus.isReady ? (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Account
                  </>
                ) : paymentAccountStatus.hasAccount ? (
                  <>
                    Continue Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Setup Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Payment Info */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Banknote className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Record Manual Payments</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Need to record a cash payment, bank transfer, or other offline payment? 
                You can record manual payments directly from the booking details page.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-blue-900/50">
                  💵 Cash
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-blue-900/50">
                  🏦 Bank Transfer
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-blue-900/50">
                  📱 QR Payment
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-blue-900/50">
                  📲 Mobile Wallet
                </span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/bookings">
                  View Bookings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payment.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('payment.searchPlaceholder')}
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
              <option value="COMPLETED">{statusLabels.COMPLETED}</option>
              <option value="FAILED">{statusLabels.FAILED}</option>
              <option value="REFUNDED">{statusLabels.REFUNDED}</option>
            </select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {t('common.exportCSV')}
            </Button>
          </div>
        </CardContent>
      </Card>

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
          <div className="space-y-4">
            {payments.map((payment) => {
              const methodKey = (payment.paymentMethod ?? 'OTHER') as keyof typeof methodIcons;
              const methodLabel = methodLabels[methodKey as keyof typeof methodLabels] ?? methodLabels.OTHER;
              const statusKey = (payment.status ?? '') as keyof typeof statusLabels;
              const statusLabel = statusLabels[statusKey];

              return (
                <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">
                          {t('payment.paymentLabel')} #{payment.id || t('common.notAvailable')}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                            payment.status || 'UNKNOWN'
                          )}`}
                        >
                          {statusLabel || t('payment.status.unknown')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('payment.amountLabel')}</span>
                          <p className="font-bold text-lg text-primary">
                            {payment.amount != null ? formatCurrency(payment.amount) : t('common.notAvailable')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('payment.methodLabel')}</span>
                          <div className="flex items-center gap-1">
                            <span>{methodIcons[methodKey] ?? methodIcons.OTHER}</span>
                            <p className="font-medium">
                              {payment.paymentMethod ? methodLabel : t('common.notAvailable')}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('payment.transactionIdLabel')}</span>
                          <p className="font-mono text-xs">
                            {payment.transactionId || t('common.notAvailable')}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('payment.dateLabel')}</span>
                          <p className="font-medium">
                            {payment.paymentDate
                              ? formatDate(payment.paymentDate, locale)
                              : t('common.notAvailable')}
                          </p>
                        </div>
                      </div>

                      {payment.createdAt && (
                        <div className="text-xs text-muted-foreground">
                          {t('payment.createdLabel')}: {formatDate(payment.createdAt, locale)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => {
                          // Try to navigate to booking details if bookingId is available
                          const bookingId = payment.bookingId || 
                            (payment._links?.booking?.href?.match(/\/bookings\/(\d+)/)?.[1]);
                          if (bookingId) {
                            router.push(`/bookings/${bookingId}?tab=payments`);
                          } else {
                            // If no booking link, show payment details in a toast
                            alert(`Payment #${payment.id}\nAmount: ${formatCurrency(payment.amount)}\nStatus: ${payment.status}\nMethod: ${payment.paymentMethod}`);
                          }
                        }}
                      >
                        {t('common.viewDetails')}
                      </Button>
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
