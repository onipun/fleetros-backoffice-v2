'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardStatistics, refreshDashboardStatistics } from '@/lib/api/reporting-api';
import type { DashboardStatisticsResponse, StatisticMetric } from '@/types/reporting';
import {
    ArrowDownIcon,
    ArrowUpIcon,
    Car,
    DollarSign,
    FileText,
    Package,
    RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatCardProps {
  title: string;
  metric: StatisticMetric;
  icon: React.ComponentType<{ className?: string }>;
  currency?: string;
}

function StatCard({ title, metric, icon: Icon, currency }: StatCardProps) {
  const isPositiveTrend = metric.trend === 'UP';
  const isNegativeTrend = metric.trend === 'DOWN';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{metric.value}</div>
        <div className="flex items-center mt-2 space-x-1">
          {isPositiveTrend && (
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          )}
          {isNegativeTrend && (
            <ArrowDownIcon className="h-4 w-4 text-rose-500" />
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

interface DashboardStatisticsProps {
  accountId: number;
}

export function DashboardStatistics({ accountId }: DashboardStatisticsProps) {
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
        ? await refreshDashboardStatistics(accountId)
        : await getDashboardStatistics(accountId);

      setStatistics(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard statistics:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchStatistics();
    }
  }, [accountId]);

  if (loading && !statistics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2" />
              <div className="h-3 bg-muted rounded w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-destructive">
              Failed to load statistics
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button
              onClick={() => fetchStatistics()}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
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
        <button
          onClick={() => fetchStatistics(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
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
          currency={statistics.currency}
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
