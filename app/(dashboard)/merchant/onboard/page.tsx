'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useUserInfo } from '@/hooks/use-user-info';
import { merchantAPI } from '@/lib/api/merchant-api';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function MerchantOnboardingPage() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  
  // Use cached user info hook
  const { data: userInfo } = useUserInfo();

  const handleStartOnboarding = async () => {
    if (loading) return;

    setLoading(true);

    try {
      // Prepare onboarding data with user information
      const onboardingData = {
        email: userInfo?.email,
        businessName: userInfo?.companyName,
        phone: userInfo?.phoneNumber,
        country: userInfo?.country,
      };

      const result = await merchantAPI.initiateMerchantOnboarding(onboardingData);

      toast({
        title: t('merchant.onboard.success.title') || 'Onboarding Started',
        description: result.message || t('merchant.onboard.success.description') || 'Redirecting to Stripe...',
      });

      // Redirect to Stripe onboarding
      window.location.href = result.onboardingUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start onboarding';
      
      toast({
        title: t('merchant.onboard.error.title') || 'Onboarding Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/merchant">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back') || 'Back'}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            {t('merchant.onboard.title') || 'Start Accepting Payments'}
          </h1>
          <p className="text-muted-foreground">
            {t('merchant.onboard.description') || 'Set up your Stripe account to receive payments'}
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('merchant.onboard.form.title') || 'Merchant Information'}</CardTitle>
          <CardDescription>
            {t('merchant.onboard.form.description') || 'Provide your business details to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('merchant.onboard.overview.message') ||
              'Your account details have been pre-filled from registration. Click below to launch Stripe onboarding and confirm the remaining steps.'}
          </p>
          <Button onClick={handleStartOnboarding} disabled={loading} className="w-full" size="lg">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('merchant.onboard.form.submit') || 'Start Onboarding'}
          </Button>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="max-w-2xl border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">
            {t('merchant.onboard.info.title') || 'What happens next?'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>{t('merchant.onboard.info.step1') || 'You will be redirected to Stripe'}</li>
            <li>{t('merchant.onboard.info.step2') || 'Complete the identity verification process'}</li>
            <li>{t('merchant.onboard.info.step3') || 'Provide your bank account details'}</li>
            <li>{t('merchant.onboard.info.step4') || 'Return to the dashboard when complete'}</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
