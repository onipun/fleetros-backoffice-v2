'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStatistics, refreshDashboardStatistics } from '@/lib/api/reporting-api';
import type { DashboardStatisticsResponse, StatisticMetric } from '@/types/reporting';
import {
    AlertCircle,
    ArrowDownIcon,
    ArrowUpIcon,
    Car,
    DollarSign,
    FileText,
    MinusIcon,
    Package,
    RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatCardProps {
  title: string;
  metric: StatisticMetric;
  icon: React.ComponentType<{ className?: string }>;
  formatValue?: (value: string) => string;
}

function StatCard({ title, metric, icon: Icon, formatValue }: StatCardProps) {
  const isPositiveTrend = metric.trend === 'UP';
  const isNegativeTrend = metric.trend === 'DOWN';
  const isNeutralTrend = metric.trend === 'NEUTRAL';

  // Use formatValue if provided, otherwise use the original value
  const displayValue = formatValue ? formatValue(metric.value) : metric.value;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{displayValue}</div>
        <div className="flex items-center mt-2 space-x-1">
          {isPositiveTrend && (
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          )}
          {isNegativeTrend && (
            <ArrowDownIcon className="h-4 w-4 text-rose-500" />
          )}
          {isNeutralTrend && (
            <MinusIcon className="h-4 w-4 text-muted-foreground" />
          )}
          <p
            className={`text-xs font-medium ${
              isPositiveTrend
                ? 'text-emerald-600 dark:text-emerald-400'
                : isNegativeTrend
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-muted-foreground'
            }`}
          >
            {metric.changeDescription}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStatistics() {
  const { formatCurrency } = useLocale();
  const [statistics, setStatistics] = useState<DashboardStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = forceRefresh
        ? await refreshDashboardStatistics()
        : await getDashboardStatistics();

      setStatistics(data);
    } catch (err: unknown) {
      console.error('Failed to fetch dashboard statistics:', err);
      const error = err as { message?: string; error?: string };
      const errorMessage = error?.message || error?.error || 'Failed to load statistics. Please check if the reporting service is running.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  // Function to format revenue value by extracting number and reformatting with user's currency
  const formatRevenueValue = (value: string): string => {
    // Extract numeric value from string like "$15,750" or "15,750"
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue)) {
      return value; // Return original if parsing fails
    }
    return formatCurrency(numericValue);
  };

  if (loading && !statistics) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-36 mt-1 animate-pulse" />
          </div>
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-10 w-10 bg-muted rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-20 mb-2" />
                <div className="h-4 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const isNetworkError = error.includes('Network error') || error.includes('Unable to connect');
    
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-destructive flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5" />
            Dashboard Statistics Unavailable
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
          
          <Button
            onClick={() => fetchStatistics()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Statistics Overview</h2>
          <p className="text-sm text-muted-foreground">
            Real-time metrics for your account
          </p>
        </div>
        <Button
          onClick={() => fetchStatistics(true)}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vehicles"
          metric={statistics.totalVehicles}
          icon={Car}
        />
        <StatCard
          title="Active Bookings"
          metric={statistics.activeBookings}
          icon={FileText}
        />
        <StatCard
          title="Total Revenue"
          metric={statistics.totalRevenue}
          icon={DollarSign}
          formatValue={formatRevenueValue}
        />
        <StatCard
          title="Active Packages"
          metric={statistics.activePackages}
          icon={Package}
        />
      </div>
    </div>
  );
}
