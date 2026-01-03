'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { merchantAPI, type MerchantStatus } from '@/lib/api/merchant-api';
import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, Loader2, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MerchantStatusBadge } from './merchant-status-badge';

interface MerchantSetupWidgetProps {
  compact?: boolean;
  showDetails?: boolean;
}

export function MerchantSetupWidget({ compact = false, showDetails = true }: MerchantSetupWidgetProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<MerchantStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupClicked, setSetupClicked] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await merchantAPI.getMerchantStatus();
        setStatus(data);
      } catch (err) {
        // Account not found - user hasn't started setup
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleSetupClick = () => {
    setSetupClicked(true);
    router.push('/merchant/onboard');
  };

  const handleViewDashboard = () => {
    router.push('/merchant');
  };

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  // Not set up yet - show setup prompt
  if (!status) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <CreditCard className="h-5 w-5" />
            {t('merchant.widget.setup.title') || 'Payment Processing'}
          </CardTitle>
          {showDetails && (
            <CardDescription>
              {t('merchant.widget.setup.description') || 'Set up your Stripe account to accept payments from customers'}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {showDetails && (
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm font-medium text-blue-900 mb-2">
                {t('merchant.widget.setup.benefits') || 'Benefits'}:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>{t('merchant.widget.setup.benefit1') || 'Accept credit card payments online'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>{t('merchant.widget.setup.benefit2') || 'Secure payment processing with Stripe'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>{t('merchant.widget.setup.benefit3') || 'Automated payouts to your bank account'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>{t('merchant.widget.setup.benefit4') || 'Real-time transaction tracking'}</span>
                </li>
              </ul>
            </div>
          )}

          <Button 
            onClick={handleSetupClick} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            size={compact ? 'default' : 'lg'}
          >
            <Store className="mr-2 h-4 w-4" />
            {t('merchant.widget.setup.button') || 'Set Up Payment Account'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {setupClicked && (
            <p className="text-xs text-center text-blue-600 animate-pulse">
              {t('merchant.widget.setup.redirecting') || 'Redirecting to setup...'}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Account is deleted - show warning
  if (status.isDeleted) {
    return (
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="h-5 w-5" />
            {t('merchant.widget.deleted.title') || 'Payment Account Issue'}
          </CardTitle>
          <CardDescription className="text-red-700">
            {t('merchant.widget.deleted.description') || 'Your Stripe account needs to be recreated'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showDetails && (
            <p className="text-sm text-red-800">
              {status.message || t('merchant.widget.deleted.message') || 'Your previous Stripe account was deleted. Please recreate your account to continue accepting payments.'}
            </p>
          )}
          <Button 
            onClick={handleViewDashboard} 
            className="w-full bg-red-600 hover:bg-red-700"
            size={compact ? 'default' : 'lg'}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t('merchant.widget.deleted.button') || 'Fix Payment Account'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Account is restricted - show warning
  const isRestricted = status.accountStatus === 'RESTRICTED' || status.accountStatus === 'RESTRICTED_SOON';
  if (isRestricted) {
    return (
      <Card className="border-orange-300 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="h-5 w-5" />
            {status.accountStatus === 'RESTRICTED' 
              ? (t('merchant.widget.restricted.title') || 'Account Restricted')
              : (t('merchant.widget.restrictedSoon.title') || 'Action Required Soon')}
          </CardTitle>
          <CardDescription className="text-orange-700">
            {status.accountStatus === 'RESTRICTED'
              ? (t('merchant.widget.restricted.description') || 'Your account has restrictions. Complete verification to resume payments.')
              : (t('merchant.widget.restrictedSoon.description') || 'Your account will be restricted soon. Please complete verification.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showDetails && (
            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">{t('merchant.widget.status') || 'Status'}:</span>
                <MerchantStatusBadge status={status.accountStatus} />
              </div>
              <p className="text-xs text-orange-700">
                {t('merchant.widget.restricted.message') || 'Stripe requires additional verification to continue processing payments.'}
              </p>
            </div>
          )}
          <Button 
            onClick={handleViewDashboard} 
            className="w-full bg-orange-600 hover:bg-orange-700"
            size={compact ? 'default' : 'lg'}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t('merchant.widget.restricted.button') || 'Complete Verification'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Account is set up - show status
  const isReady = status.canAcceptPayments;

  // Only show the widget if payment is NOT ready (pending setup)
  // Once completed, hide the entire widget
  if (isReady) {
    return null;
  }

  const borderColor = 'border-yellow-200';
  const bgGradient = 'from-yellow-50 to-white';
  const textColor = 'text-yellow-900';
  const iconColor = 'text-yellow-600';

  return (
    <Card className={`${borderColor} bg-gradient-to-br ${bgGradient}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textColor}`}>
          <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
          {t('merchant.widget.pending.title') || 'Payment Setup Pending'}
        </CardTitle>
        {showDetails && (
          <CardDescription className="text-yellow-700">
            {t('merchant.widget.pending.description') || 'Complete verification to start accepting payments'}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showDetails && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">{t('merchant.widget.status') || 'Status'}:</span>
              <MerchantStatusBadge status={status.onboardingStatus} />
            </div>
            {status.email && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('merchant.widget.email') || 'Email'}:</span>
                <span className="font-medium text-gray-900 truncate ml-2">{status.email}</span>
              </div>
            )}
          </div>
        )}

        {!compact && (
          <div className="text-xs text-yellow-700 space-y-1">
            <div className="flex items-center gap-2">
              {status.chargesEnabled ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              <span>
                {status.chargesEnabled 
                  ? t('merchant.widget.charges.enabled') || 'Charges enabled'
                  : t('merchant.widget.charges.disabled') || 'Charges pending'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {status.payoutsEnabled ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              <span>
                {status.payoutsEnabled 
                  ? t('merchant.widget.payouts.enabled') || 'Payouts enabled'
                  : t('merchant.widget.payouts.disabled') || 'Payouts pending'}
              </span>
            </div>
          </div>
        )}

        {/* Action Button - Continue/Complete Onboarding */}
        <Button 
          onClick={handleSetupClick} 
          className="w-full bg-yellow-600 hover:bg-yellow-700"
          size={compact ? 'default' : 'lg'}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          {t('merchant.widget.pending.button') || 'Continue Setup'}
        </Button>
      </CardContent>
    </Card>
  );
}
