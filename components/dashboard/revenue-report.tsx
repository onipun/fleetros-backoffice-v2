'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRevenueReport } from '@/lib/api/reporting-api';
import type { RevenueReportResponse } from '@/types/reporting';
import {
    Calendar,
    DollarSign,
    FileText,
    Package,
    PercentIcon,
    TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RevenueReportProps {
  accountId: number;
  startDate?: string;
  endDate?: string;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function RevenueReport({
  accountId,
  startDate,
  endDate,
}: RevenueReportProps) {
  const [report, setReport] = useState<RevenueReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default to current month if no dates provided
  const getDefaultDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const dates = startDate && endDate ? { start: startDate, end: endDate } : getDefaultDates();
      
      console.log('Fetching revenue report:', {
        accountId,
        startDate: dates.start,
        endDate: dates.end,
      });
      
      const data = await getRevenueReport(accountId, dates.start, dates.end);

      setReport(data);
    } catch (err: any) {
      console.error('Failed to fetch revenue report:', err);
      const errorMessage = err?.message || err?.error || 'Failed to load revenue report. Please check if the reporting service is running.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchReport();
    }
  }, [accountId, startDate, endDate]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-32" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-24 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    const isNetworkError = error.includes('Network error') || error.includes('Unable to connect');
    
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Revenue Report Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">
              Failed to load revenue report
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          
          {isNetworkError && (
            <div className="rounded-md bg-muted p-3 space-y-2">
              <p className="text-xs font-semibold">Troubleshooting Steps:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Ensure the reporting service is running on port 8084</li>
                <li>Check the <code className="bg-background px-1 rounded">NEXT_PUBLIC_REPORTING_API_URL</code> environment variable</li>
                <li>Verify network connectivity and CORS settings</li>
                <li>Check the browser console for detailed error logs</li>
              </ol>
            </div>
          )}
          
          <button
            onClick={fetchReport}
            className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return null;
  }

  const { metadata, revenueBreakdown, bookingStats, financialSummary } = report;

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revenue Report</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(metadata.periodStart).toLocaleDateString()} -{' '}
              {new Date(metadata.periodEnd).toLocaleDateString()}
            </span>
            <span className="mx-2">•</span>
            <span className="uppercase font-medium">{metadata.reportType}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Generated</p>
          <p className="text-sm font-medium">
            {new Date(metadata.reportDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vehicle Rentals
              </CardTitle>
              <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueBreakdown.vehicleRentalRevenue, metadata.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(revenueBreakdown.vehicleRentalPercentage)} of total
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${revenueBreakdown.vehicleRentalPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Packages
              </CardTitle>
              <div className="h-9 w-9 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-violet-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueBreakdown.packageRevenue, metadata.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(revenueBreakdown.packagePercentage)} of total
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-violet-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${revenueBreakdown.packagePercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Offerings
              </CardTitle>
              <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueBreakdown.offeringRevenue, metadata.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(revenueBreakdown.offeringPercentage)} of total
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${revenueBreakdown.offeringPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary & Booking Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Financial Summary
            </CardTitle>
            <CardDescription>Detailed revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Gross Revenue</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.grossRevenue, metadata.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Total Discounts</span>
              <span className="font-semibold text-rose-600">
                -{formatCurrency(financialSummary.totalDiscounts, metadata.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Net Revenue</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.netRevenue, metadata.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Total Taxes</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.totalTaxes, metadata.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Service Fees</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.totalServiceFees, metadata.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t-2">
              <span className="font-bold">Final Revenue</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(financialSummary.finalRevenue, metadata.currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Booking Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Booking Statistics
            </CardTitle>
            <CardDescription>Performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{bookingStats.totalBookings}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {bookingStats.completedBookings}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-rose-600">
                  {bookingStats.cancelledBookings}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(bookingStats.averageBookingValue, metadata.currency)}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <PercentIcon className="h-3 w-3" />
                    {formatPercentage(bookingStats.completionRate)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${bookingStats.completionRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Cancellation Rate</span>
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <PercentIcon className="h-3 w-3" />
                    {formatPercentage(bookingStats.cancellationRate)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${bookingStats.cancellationRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
