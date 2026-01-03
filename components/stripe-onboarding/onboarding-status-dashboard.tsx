'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    getDashboardLink,
    getMerchantStatus,
    recreateMerchantAccount,
    refreshOnboardingLink,
} from '@/lib/api/stripe-onboarding';
import { AccountStatus, OnboardingStatus, type MerchantStatus } from '@/types/stripe-onboarding';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ExternalLink,
    Loader2,
    RefreshCw,
    ShieldAlert,
    Trash2,
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
  const [isRecreating, setIsRecreating] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getMerchantStatus();
      
      // Handle "Merchant not found" as a valid state (no account yet)
      const isMerchantNotFound = !data.success && (
        data.error?.includes('Merchant not found') ||
        data.message?.includes('Merchant not found')
      );
      
      if (isMerchantNotFound) {
        // Clear status to show "No onboarding status found" UI
        setStatus(null);
        return;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch status');
      }
      setStatus(data);
    } catch (error: any) {
      // Also handle "Merchant not found" from thrown errors
      const isMerchantNotFound = 
        error?.message?.includes('Merchant not found') ||
        error?.error?.includes('Merchant not found');
      
      if (isMerchantNotFound) {
        setStatus(null);
        return;
      }
      
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

  const handleRecreateAccount = async () => {
    if (!status) return;
    
    setIsRecreating(true);
    try {
      const response = await recreateMerchantAccount({
        country: 'MY', // Default country - could be made configurable
        email: status.email,
        businessName: status.businessName,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to recreate account');
      }
      
      toast({
        title: 'Success',
        description: 'Account recreated successfully. Redirecting to onboarding...',
      });
      
      // Redirect to onboarding URL
      if (response.onboardingUrl) {
        setTimeout(() => {
          window.location.href = response.onboardingUrl!;
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to recreate account',
        variant: 'destructive',
      });
      setIsRecreating(false);
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
    // Don't render anything if no status - MerchantSetupWidget handles this case
    return null;
  }

  // Check if account is deleted
  const isAccountDeleted = status.isDeleted || 
    status.onboardingStatus === OnboardingStatus.ACCOUNT_DELETED ||
    status.accountStatus === AccountStatus.DELETED;

  // Check if account is restricted
  const isAccountRestricted = status.accountStatus === AccountStatus.RESTRICTED ||
    status.accountStatus === AccountStatus.RESTRICTED_SOON;

  // Handle deleted account state
  if (isAccountDeleted && status.recreationAvailable) {
    return (
      <div className="space-y-6">
        <Card className="border-red-300 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trash2 className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-red-900 dark:text-red-100">
                  Payment Account Deleted
                </CardTitle>
                <CardDescription className="text-red-700 dark:text-red-200">
                  {status.message || 'Your Stripe account has been deleted or access was revoked.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-red-200">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Account Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span>{status.email}</span>
                </div>
                {status.gatewayAccountId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Previous Account ID:</span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {status.gatewayAccountId}
                    </code>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Important</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-200 mt-2 space-y-1 list-disc list-inside">
                    <li>A new Stripe account will be created with a new ID</li>
                    <li>Previous transaction history will not be transferred</li>
                    <li>You will need to complete onboarding again</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRecreateAccount}
                disabled={isRecreating}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRecreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recreating Account...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recreate Payment Account
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleRefreshStatus} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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

          {/* Restricted Account Warning */}
          {isAccountRestricted && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    {status.accountStatus === AccountStatus.RESTRICTED 
                      ? 'Account Restricted' 
                      : 'Account Will Be Restricted Soon'}
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                    {status.accountStatus === AccountStatus.RESTRICTED 
                      ? 'Your account has restrictions that prevent payment processing. Please complete the required verification steps.'
                      : 'Your account will be restricted soon if you don\'t complete the required verification. Please take action now to avoid service interruption.'}
                  </p>
                  <div className="mt-3">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={handleRefreshLink}
                      disabled={isRefreshingLink}
                    >
                      {isRefreshingLink ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Complete Verification
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Failed Onboarding Message */}
          {status.onboardingStatus === OnboardingStatus.FAILED && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    Onboarding Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                    {status.message || 'There was an issue with your onboarding. Please try again or contact support.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejected Account Message */}
          {status.accountStatus === AccountStatus.REJECTED && (
            <div className="p-4 rounded-lg border border-red-300 bg-red-100 dark:bg-red-950">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-700 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    Application Rejected
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                    Your application was rejected by Stripe. This may be due to incomplete or invalid information. 
                    Please contact support for assistance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!status.canAcceptPayments && !status.chargesEnabled && (
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
