'use client';

import { TablePageSkeleton } from '@/components/skeletons/page-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/api/hooks';
import { formatCurrency, formatDate, parseHalResource } from '@/lib/utils';
import type { Payment } from '@/types';
import { CreditCard, Download, Plus, Search } from 'lucide-react';
import { useState } from 'react';

export default function PaymentsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = useCollection<Payment>('payments', {
    page,
    size: 20,
    sort: 'createdAt,desc',
  });

  const payments = data ? parseHalResource<Payment>(data, 'payments') : [];
  const totalPages = data?.page?.totalPages || 0;

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

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      CREDIT_CARD: '💳',
      DEBIT_CARD: '💳',
      PAYPAL: '🅿️',
      BANK_TRANSFER: '🏦',
      CASH: '💵',
      OTHER: '💰',
    };
    return icons[method] || '💰';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Track and manage payment transactions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID..."
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
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      {isLoading ? (
        <TablePageSkeleton rows={8} />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Error loading payments: {error.message}</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No payments found</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Record Your First Payment
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">
                          Payment #{payment.id || 'Unknown'}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                            payment.status || 'UNKNOWN'
                          )}`}
                        >
                          {payment.status || 'UNKNOWN'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <p className="font-bold text-lg text-primary">
                            {payment.amount != null ? formatCurrency(payment.amount) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Method:</span>
                          <div className="flex items-center gap-1">
                            <span>{getPaymentMethodIcon(payment.paymentMethod || 'OTHER')}</span>
                            <p className="font-medium">
                              {payment.paymentMethod ? payment.paymentMethod.replace('_', ' ') : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Transaction ID:</span>
                          <p className="font-mono text-xs">
                            {payment.transactionId || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p className="font-medium">
                            {payment.paymentDate
                              ? formatDate(payment.paymentDate)
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {payment.createdAt && (
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(payment.createdAt)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm">View Details</Button>
                      <Button size="sm" variant="outline">
                        Receipt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
