'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    getDashboardLink,
    getMerchantStatus,
    refreshOnboardingLink,
} from '@/lib/api/stripe-onboarding';
import { OnboardingStatus, type MerchantStatus } from '@/types/stripe-onboarding';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    ExternalLink,
    Loader2,
    RefreshCw,
    Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AccountStatusBadge, OnboardingStatusBadge } from './status-badges';

interface OnboardingStatusDashboardProps {
  businessAccountId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function OnboardingStatusDashboard({
  businessAccountId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: OnboardingStatusDashboardProps) {
  const [status, setStatus] = useState<MerchantStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingLink, setIsRefreshingLink] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getMerchantStatus();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch status');
      }
      setStatus(data);
    } catch (error: any) {
      console.error('Error fetching status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch onboarding status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await fetchStatus(false);
  };

  const handleRefreshLink = async () => {
    setIsRefreshingLink(true);
    try {
      const response = await refreshOnboardingLink();
      if (!response.success) {
        throw new Error(response.error || 'Failed to refresh link');
      }
      toast({
        title: 'Success',
        description: 'Onboarding link refreshed. Redirecting...',
      });
      // Redirect to new link
      setTimeout(() => {
        window.location.href = response.onboardingUrl;
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to refresh onboarding link',
        variant: 'destructive',
      });
      setIsRefreshingLink(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      const response = await getDashboardLink();
      if (!response.success) {
        throw new Error(response.error || 'Failed to get dashboard link');
      }
      window.open(response.dashboardUrl, '_blank');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get dashboard link',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [businessAccountId]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !status) return;

    // Only auto-refresh if status is not verified
    if (
      status.onboardingStatus === OnboardingStatus.VERIFIED &&
      status.chargesEnabled
    ) {
      return;
    }

    const interval = setInterval(() => {
      fetchStatus(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No onboarding status found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Account Status</CardTitle>
              <CardDescription>
                {status.businessName} - {status.email}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-3">
            <OnboardingStatusBadge
              onboardingStatus={status.onboardingStatus}
              accountStatus={status.accountStatus}
              chargesEnabled={status.chargesEnabled}
            />
            <AccountStatusBadge accountStatus={status.accountStatus} />
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div
                className={`p-2 rounded-full ${
                  status.chargesEnabled
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">Accept Payments</div>
                <div className="text-xs text-muted-foreground">
                  {status.chargesEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div
                className={`p-2 rounded-full ${
                  status.payoutsEnabled
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">Receive Payouts</div>
                <div className="text-xs text-muted-foreground">
                  {status.payoutsEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {status.requirementsCurrentlyDue && status.requirementsCurrentlyDue.length > 0 && (
            <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100">
                    Action Required
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                    The following information is needed:
                  </p>
                  <ul className="list-disc list-inside text-sm text-orange-700 dark:text-orange-200 mt-2 space-y-1">
                    {status.requirementsCurrentlyDue.map((req, idx) => (
                      <li key={idx}>{req.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {status.requirementsEventuallyDue && status.requirementsEventuallyDue.length > 0 && (
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Information Needed Soon
                  </h4>
                  <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-200 mt-2 space-y-1">
                    {status.requirementsEventuallyDue.map((req, idx) => (
                      <li key={idx}>{req.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {status.canAcceptPayments && status.onboardingStatus === OnboardingStatus.VERIFIED && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    Payment Ready!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                    Your account is fully verified and ready to accept payments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!status.canAcceptPayments && (
              <Button onClick={handleRefreshLink} disabled={isRefreshingLink}>
                {isRefreshingLink ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Continue Onboarding
                  </>
                )}
              </Button>
            )}

            {status.chargesEnabled && (
              <Button variant="outline" onClick={handleOpenDashboard}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Stripe Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
