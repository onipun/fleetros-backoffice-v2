'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { merchantAPI, type MerchantStatus } from '@/lib/api/merchant-api';
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MerchantStatusBadge } from './merchant-status-badge';

export function MerchantStatusDisplay() {
  const { t } = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<MerchantStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState<number | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const data = await merchantAPI.getMerchantStatus();
      setStatus(data);
      
      // Auto-redirect countdown for deleted accounts
      if (data.isDeleted && data.recreationAvailable) {
        setAutoRedirectCountdown(10); // 10 seconds countdown
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('merchant.status.errorMessage') || 'Failed to load merchant status'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Auto-redirect countdown for deleted accounts
  useEffect(() => {
    if (autoRedirectCountdown === null) return;
    
    if (autoRedirectCountdown === 0) {
      router.push('/merchant/recreate');
      return;
    }

    const timer = setTimeout(() => {
      setAutoRedirectCountdown(autoRedirectCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoRedirectCountdown, router]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const handleRecreate = async () => {
    setAutoRedirectCountdown(null); // Cancel countdown
    setLoading(true);
    
    try {
      // Call recreate API with the existing account info
      const result = await merchantAPI.recreateDeletedAccount({
        country: 'MY', // Default country, can be adjusted
        email: status?.email || '',
        businessName: status?.businessName || '',
        phone: '',
      });

      // Redirect to Stripe onboarding URL
      window.location.href = result.onboardingUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('merchant.recreate.error') || 'Failed to recreate account'
      );
      setLoading(false);
    }
  };

  const handleCancelRedirect = () => {
    setAutoRedirectCountdown(null);
  };

  const handleOnboard = () => {
    router.push('/merchant/onboard');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            {t('merchant.status.error') || 'Error Loading Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('common.retry') || 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('merchant.status.notFound') || 'No Merchant Account'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('merchant.status.notFoundDescription') || 'You have not set up a merchant account yet.'}
          </p>
          <Button onClick={handleOnboard}>
            {t('merchant.onboard.start') || 'Start Onboarding'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Handle deleted account - show prominent warning with recreation action
  if (status.isDeleted && status.recreationAvailable) {
    return (
      <Card className="border-red-400 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            {t('merchant.status.deleted.title') || 'Stripe Account Deleted'}
          </CardTitle>
          <CardDescription className="text-red-700">
            {status.message || t('merchant.status.deleted.description') || 'Your Stripe account has been deleted or access has been revoked. You must recreate your account to accept payments.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <p className="font-medium text-red-900 mb-3">
              {t('merchant.status.deleted.details') || 'Account Details'}:
            </p>
            <div className="space-y-2 text-sm text-red-800">
              <div className="flex justify-between">
                <span className="font-medium">
                  {t('merchant.status.deleted.emailLabel') || 'Email'}:
                </span>
                <span>{status.email}</span>
              </div>
              {status.gatewayAccountId && (
                <div className="flex justify-between">
                  <span className="font-medium">
                    {t('merchant.status.deleted.accountIdLabel') || 'Previous Account ID'}:
                  </span>
                  <code className="bg-red-100 px-2 py-1 rounded text-xs font-mono">
                    {status.gatewayAccountId}
                  </code>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">
                  {t('merchant.status.deleted.statusLabel') || 'Status'}:
                </span>
                <MerchantStatusBadge status={status.onboardingStatus} />
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              {t('merchant.status.deleted.important') || 'Important'}:
            </p>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>{t('merchant.status.deleted.point1') || 'A new Stripe account will be created with a new ID'}</li>
              <li>{t('merchant.status.deleted.point2') || 'Previous transaction history will not be transferred'}</li>
              <li>{t('merchant.status.deleted.point3') || 'You will need to complete onboarding again'}</li>
            </ul>
          </div>

          {autoRedirectCountdown !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-blue-800">
                {t('merchant.status.deleted.autoRedirect') || 'Redirecting to account recreation in'}:{' '}
                <span className="text-2xl font-bold">{autoRedirectCountdown}</span> {t('common.seconds') || 'seconds'}
              </p>
              <Button 
                onClick={handleCancelRedirect} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleRecreate} 
              className="bg-red-600 hover:bg-red-700 flex-1"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('merchant.recreate.creating') || 'Creating Account...'}
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {autoRedirectCountdown !== null 
                    ? t('merchant.recreate.buttonNow') || 'Recreate & Start Onboarding' 
                    : t('merchant.recreate.button') || 'Recreate & Start Onboarding'}
                </>
              )}
            </Button>
            <Button onClick={handleRefresh} variant="outline" size="lg" disabled={refreshing || loading}>
              {refreshing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {t('common.refresh') || 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle active account
  const isReady = status.canAcceptPayments;
  const borderColor = isReady ? 'border-green-400' : 'border-blue-400';
  const bgColor = isReady ? 'bg-green-50' : 'bg-blue-50';
  const textColor = isReady ? 'text-green-800' : 'text-blue-800';
  const mutedColor = isReady ? 'text-green-700' : 'text-blue-700';

  const enabledLabel = t('merchant.status.enabled') || t('common.yes') || 'Yes';
  const disabledLabel = t('merchant.status.disabled') || t('common.no') || 'No';

  const renderBooleanStatus = (value: boolean) => (
    <span className="flex items-center gap-1">
      {value ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {value ? enabledLabel : disabledLabel}
    </span>
  );

  return (
    <Card className={`${borderColor} ${bgColor}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textColor}`}>
          {isReady ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              {t('merchant.status.ready.title') || 'Ready to Accept Payments'}
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5" />
              {t('merchant.status.pending.title') || 'Onboarding in Progress'}
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`text-sm ${mutedColor} space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{t('merchant.status.status') || 'Status'}:</span>
            <MerchantStatusBadge status={status.onboardingStatus} />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{t('merchant.status.email') || 'Email'}:</span>
            <span>{status.email}</span>
          </div>
          {status.businessName && (
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('merchant.status.business') || 'Business'}:</span>
              <span>{status.businessName}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-medium">{t('merchant.status.charges') || 'Charges Enabled'}:</span>
            {renderBooleanStatus(status.chargesEnabled)}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{t('merchant.status.payouts') || 'Payouts Enabled'}:</span>
            {renderBooleanStatus(status.payoutsEnabled)}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            {refreshing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {t('common.refresh') || 'Refresh'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
