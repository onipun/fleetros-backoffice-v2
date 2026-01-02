/**
 * Reporting Service Type Definitions
 * Based on REPORTING_API_INTEGRATION.md
 */

export type TrendDirection = 'UP' | 'DOWN' | 'NEUTRAL';

export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';

export interface StatisticMetric {
  value: string;
  changePercentage: number;
  trend: TrendDirection;
  changeDescription: string;
}

export interface DashboardStatisticsResponse {
  totalVehicles: StatisticMetric;
  activeBookings: StatisticMetric;
  totalRevenue: StatisticMetric;
  activePackages: StatisticMetric;
  currency: string;
  comparisonPeriod: string;
}

export interface ReportMetadata {
  reportDate: string;
  periodStart: string;
  periodEnd: string;
  reportType: ReportType;
  currency: string;
  durationDays: number;
}

export interface RevenueBreakdown {
  vehicleRentalRevenue: number;
  packageRevenue: number;
  offeringRevenue: number;
  totalBookingRevenue: number;
  vehicleRentalPercentage: number;
  packagePercentage: number;
  offeringPercentage: number;
}

export interface BookingStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  completionRate: number;
  cancellationRate: number;
}

export interface FinancialSummary {
  grossRevenue: number;
  totalDiscounts: number;
  netRevenue: number;
  totalTaxes: number;
  totalServiceFees: number;
  finalRevenue: number;
}

export interface RevenueReportResponse {
  metadata: ReportMetadata;
  revenueBreakdown: RevenueBreakdown;
  bookingStats: BookingStats;
  financialSummary: FinancialSummary;
}

export interface ReportRequest {
  startDate: string;
  endDate: string;
  forceRefresh?: boolean;
  includeDetails?: boolean;
}

export interface ReportingError {
  message: string;
  status: number;
  error?: string;
}
