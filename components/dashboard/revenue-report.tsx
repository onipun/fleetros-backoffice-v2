'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueDatePicker } from '@/components/ui/revenue-date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    cleanupOldReports,
    generateRevenueReport,
    getRevenueReport,
    getRevenueReportsByType,
} from '@/lib/api/reporting-api';
import type { ReportType, RevenueReportResponse } from '@/types/reporting';
import {
    AlertCircle,
    Calendar,
    ChevronRight,
    DollarSign,
    FileText,
    History,
    Package,
    PercentIcon,
    RefreshCw,
    Trash2,
    TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RevenueReportProps {
  startDate?: string;
  endDate?: string;
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Get default date range (current month)
function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function RevenueReport({
  startDate: propStartDate,
  endDate: propEndDate,
}: RevenueReportProps) {
  const { formatCurrency } = useLocale();
  const defaultDates = getDefaultDates();
  
  // Current report state
  const [report, setReport] = useState<RevenueReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state
  const [startDate, setStartDate] = useState(propStartDate || defaultDates.start);
  const [endDate, setEndDate] = useState(propEndDate || defaultDates.end);
  const [reportType, setReportType] = useState<ReportType>('MONTHLY');
  
  // Historical reports state
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('MONTHLY');
  const [historicalReports, setHistoricalReports] = useState<RevenueReportResponse[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  // Fetch current report
  const fetchReport = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getRevenueReport(startDate, endDate, forceRefresh);
      setReport(data);
    } catch (err: unknown) {
      console.error('Failed to fetch revenue report:', err);
      const error = err as { message?: string; error?: string };
      const errorMessage = error?.message || error?.error || 'Failed to load revenue report.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Generate new report
  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const data = await generateRevenueReport({
        startDate,
        endDate,
        reportType,
        forceRefresh: true,
        includeDetails: true,
      });
      
      setReport(data);
    } catch (err: unknown) {
      console.error('Failed to generate revenue report:', err);
      const error = err as { message?: string; error?: string };
      const errorMessage = error?.message || error?.error || 'Failed to generate report.';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  // Handle date range change from picker
  const handleDateRangeChange = (start: string, end: string, type: ReportType) => {
    setStartDate(start);
    setEndDate(end);
    setReportType(type);
  };

  // Handle cleanup old reports
  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to delete old reports (older than 90 days)? This action cannot be undone.')) {
      return;
    }

    try {
      setCleaningUp(true);
      const result = await cleanupOldReports(90);
      alert(`${result.message}\n${result.deletedCount} reports deleted.`);
      
      // Refresh historical reports after cleanup
      await fetchHistoricalReports(selectedReportType);
    } catch (err: unknown) {
      console.error('Failed to cleanup reports:', err);
      const error = err as { message?: string; error?: string };
      const errorMessage = error?.message || error?.error || 'Failed to cleanup reports.';
      alert(`Cleanup failed: ${errorMessage}`);
    } finally {
      setCleaningUp(false);
    }
  };

  // Handle clicking a historical report
  const handleHistoricalReportClick = (historicalReport: RevenueReportResponse) => {
    setReport(historicalReport);
    setActiveTab('current');
  };

  // Fetch historical reports by type
  const fetchHistoricalReports = async (reportType: ReportType) => {
    try {
      setLoadingHistorical(true);
      setHistoricalError(null);
      
      const data = await getRevenueReportsByType(reportType, 10);
      setHistoricalReports(data);
    } catch (err: unknown) {
      console.error('Failed to fetch historical reports:', err);
      const error = err as { message?: string; error?: string };
      const errorMessage = error?.message || error?.error || 'Failed to load historical reports.';
      setHistoricalError(errorMessage);
    } finally {
      setLoadingHistorical(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReport();
  }, []);

  // Update dates when props change
  useEffect(() => {
    if (propStartDate) setStartDate(propStartDate);
    if (propEndDate) setEndDate(propEndDate);
  }, [propStartDate, propEndDate]);

  // Fetch historical reports when type changes
  useEffect(() => {
    fetchHistoricalReports(selectedReportType);
  }, [selectedReportType]);

  return (
    <div className="space-y-6">
      {/* Header with Date Range Controls */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Revenue Report
              </CardTitle>
              <CardDescription>
                Generate and view revenue reports for custom date ranges
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RevenueDatePicker
            onDateRangeChange={handleDateRangeChange}
            onGenerate={handleGenerateReport}
            disabled={generating || loading}
          />
        </CardContent>
      </Card>

      {/* Tabs for Current vs Historical */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="current">
            <FileText className="h-4 w-4 mr-2" />
            Current Report
          </TabsTrigger>
          <TabsTrigger value="historical">
            <History className="h-4 w-4 mr-2" />
            Historical Reports
          </TabsTrigger>
        </TabsList>

        {/* Current Report Tab */}
        <TabsContent value="current" className="space-y-6 mt-6">
          {loading && !report ? (
            <ReportLoadingSkeleton />
          ) : error ? (
            <ErrorCard error={error} onRetry={() => fetchReport()} />
          ) : report ? (
            <ReportContent report={report} formatCurrency={formatCurrency} />
          ) : null}
        </TabsContent>

        {/* Historical Reports Tab */}
        <TabsContent value="historical" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle className="text-base">Filter by Report Type</CardTitle>
                  </div>
                  <Select
                    value={selectedReportType}
                    onValueChange={(value) => setSelectedReportType(value as ReportType)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCleanup}
                  disabled={cleaningUp}
                  variant="destructive"
                  size="sm"
                >
                  {cleaningUp ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cleanup Old Reports
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHistorical ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-4 bg-muted rounded w-32 mb-2" />
                      <div className="h-6 bg-muted rounded w-24" />
                    </div>
                  ))}
                </div>
              ) : historicalError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm">{historicalError}</p>
                </div>
              ) : historicalReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No {selectedReportType.toLowerCase()} reports found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historicalReports.map((historicalReport, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoricalReportClick(historicalReport)}
                      className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(historicalReport.metadata.periodStart)} -{' '}
                            {formatDate(historicalReport.metadata.periodEnd)}
                          </p>
                          <p className="text-lg font-semibold mt-1">
                            {formatCurrency(historicalReport.financialSummary.finalRevenue)}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Loading skeleton component
function ReportLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 bg-muted rounded w-40 animate-pulse" />
          <div className="h-4 bg-muted rounded w-56 mt-2 animate-pulse" />
        </div>
        <div className="text-right">
          <div className="h-4 bg-muted rounded w-20 animate-pulse" />
          <div className="h-4 bg-muted rounded w-24 mt-1 animate-pulse" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-28" />
                <div className="h-9 w-9 bg-muted rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-muted rounded w-24 mb-2" />
              <div className="h-3 bg-muted rounded w-20 mb-2" />
              <div className="h-1.5 bg-muted rounded-full w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Error card component
function ErrorCard({ error, onRetry }: { error: string; onRetry: () => void }) {
  const isNetworkError = error.includes('Network error') || error.includes('Unable to connect');
  
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-destructive flex items-center gap-2 text-base">
          <AlertCircle className="h-5 w-5" />
          Revenue Report Unavailable
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{error}</p>
        
        {isNetworkError && (
          <div className="rounded-md bg-muted/50 p-3 space-y-2">
            <p className="text-xs font-semibold">Troubleshooting Steps:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Ensure the reporting service is running on port 8084</li>
              <li>Verify network connectivity and CORS settings</li>
              <li>Check the browser console for detailed error logs</li>
            </ol>
          </div>
        )}
        
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

// Report content component
function ReportContent({ report, formatCurrency }: { report: RevenueReportResponse; formatCurrency: (amount: number) => string }) {
  const { metadata, revenueBreakdown, bookingStats, financialSummary } = report;

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Revenue Breakdown</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(metadata.periodStart)} - {formatDate(metadata.periodEnd)}
            </span>
            <span className="mx-2">•</span>
            <span className="uppercase font-medium text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {metadata.reportType}
            </span>
            <span className="mx-2">•</span>
            <span>{metadata.durationDays} days</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Generated</p>
          <p className="text-sm font-medium">
            {formatDate(metadata.reportDate)}
          </p>
        </div>
      </div>

      {/* Revenue Breakdown Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow duration-300 border">
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
              {formatCurrency(revenueBreakdown.vehicleRentalRevenue)}
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

        <Card className="hover:shadow-lg transition-shadow duration-300 border">
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
              {formatCurrency(revenueBreakdown.packageRevenue)}
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

        <Card className="hover:shadow-lg transition-shadow duration-300 border">
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
              {formatCurrency(revenueBreakdown.offeringRevenue)}
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
        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-primary" />
              Financial Summary
            </CardTitle>
            <CardDescription>Detailed revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Gross Revenue</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.grossRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Total Discounts</span>
              <span className="font-semibold text-rose-600">
                -{formatCurrency(financialSummary.totalDiscounts)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Net Revenue</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.netRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Total Taxes</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.totalTaxes)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Service Fees</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.totalServiceFees)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t-2">
              <span className="font-bold">Final Revenue</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(financialSummary.finalRevenue)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Booking Statistics */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
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
                  {formatCurrency(bookingStats.averageBookingValue)}
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
