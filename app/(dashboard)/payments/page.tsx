'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { TablePageSkeleton } from '@/components/skeletons/page-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/api/hooks';
import { formatDate, parseHalResource } from '@/lib/utils';
import type { Payment } from '@/types';
import { CreditCard, Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function PaymentsPage() {
  const { t, formatCurrency, locale } = useLocale();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error, refetch } = useCollection<Payment>('payments', {
    page,
    size: 20,
    sort: 'createdAt,desc',
  });

  const payments = data ? parseHalResource<Payment>(data, 'payments') : [];
  const totalPages = data?.page?.totalPages || 0;

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
                      <Button size="sm">{t('common.viewDetails')}</Button>
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
