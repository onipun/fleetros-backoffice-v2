'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { merchantAPI } from '@/lib/api/merchant-api';
import { AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MerchantReturnPage() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'pending' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Get merchant status after returning from Stripe
        const merchantStatus = await merchantAPI.getMerchantStatus();

        if (merchantStatus.canAcceptPayments && merchantStatus.chargesEnabled && merchantStatus.payoutsEnabled) {
          setStatus('success');
          setMessage(
            t('merchant.return.success.message') ||
              'Your merchant account is verified and ready to accept payments!'
          );
        } else if (merchantStatus.onboardingStatus === 'PENDING' || merchantStatus.onboardingStatus === 'IN_PROGRESS') {
          setStatus('pending');
          setMessage(
            merchantStatus.message ||
            t('merchant.return.pending.message') ||
            'Additional information is required to complete your account setup.'
          );
        } else {
          setStatus('pending');
          setMessage(
            t('merchant.return.pending.general') ||
              'Your onboarding is in progress. Please complete any remaining requirements.'
          );
        }
      } catch (err) {
        setStatus('error');
        setMessage(
          err instanceof Error
            ? err.message
            : t('merchant.return.error.message') || 'Failed to verify account status'
        );
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [t]);

  const handleViewDashboard = () => {
    router.push('/merchant');
  };

  const handleRetryOnboarding = () => {
    router.push('/merchant/onboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {t('merchant.return.loading') || 'Verifying your account status...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-8">
      {/* Success State */}
      {status === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div>
                <CardTitle className="text-green-900">
                  {t('merchant.return.success.title') || 'Onboarding Complete!'}
                </CardTitle>
                <CardDescription className="text-green-700">
                  {message}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-green-900">
                  {t('merchant.return.success.nextSteps') || 'What you can do now:'}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                  <li>{t('merchant.return.success.step1') || 'Accept payments from customers'}</li>
                  <li>{t('merchant.return.success.step2') || 'View transaction history'}</li>
                  <li>{t('merchant.return.success.step3') || 'Manage payout settings in Stripe dashboard'}</li>
                  <li>{t('merchant.return.success.step4') || 'Configure booking and pricing options'}</li>
                </ul>
              </div>
              <Button onClick={handleViewDashboard} size="lg" className="w-full">
                {t('merchant.return.success.viewDashboard') || 'Go to Dashboard'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending State */}
      {status === 'pending' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-12 w-12 text-yellow-600" />
              <div>
                <CardTitle className="text-yellow-900">
                  {t('merchant.return.pending.title') || 'Action Required'}
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  {message}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-yellow-900">
                  {t('merchant.return.pending.instructions') || 'Next Steps:'}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  <li>{t('merchant.return.pending.step1') || 'Check your email for instructions from Stripe'}</li>
                  <li>{t('merchant.return.pending.step2') || 'Complete any required verification documents'}</li>
                  <li>{t('merchant.return.pending.step3') || 'Return to the merchant dashboard to check status'}</li>
                  <li>{t('merchant.return.pending.step4') || 'Contact support if you need assistance'}</li>
                </ul>
              </div>
              <Button onClick={handleViewDashboard} size="lg" className="w-full">
                {t('merchant.return.pending.viewDashboard') || 'View Dashboard'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {status === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="h-12 w-12 text-red-600" />
              <div>
                <CardTitle className="text-red-900">
                  {t('merchant.return.error.title') || 'Onboarding Error'}
                </CardTitle>
                <CardDescription className="text-red-700">
                  {message}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-red-900">
                  {t('merchant.return.error.troubleshooting') || 'Troubleshooting:'}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                  <li>{t('merchant.return.error.step1') || 'Try refreshing your account status'}</li>
                  <li>{t('merchant.return.error.step2') || 'Restart the onboarding process if needed'}</li>
                  <li>{t('merchant.return.error.step3') || 'Check if your account was deleted or revoked'}</li>
                  <li>{t('merchant.return.error.step4') || 'Contact support for assistance'}</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleViewDashboard} variant="outline" className="flex-1">
                  {t('merchant.return.error.viewDashboard') || 'View Dashboard'}
                </Button>
                <Button onClick={handleRetryOnboarding} className="flex-1">
                  {t('merchant.return.error.retry') || 'Retry Onboarding'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
