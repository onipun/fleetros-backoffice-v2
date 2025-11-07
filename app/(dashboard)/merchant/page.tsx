'use client';

import { MerchantStatusDisplay } from '@/components/merchant/merchant-status-display';
import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, CreditCard, Store } from 'lucide-react';

export default function MerchantDashboardPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Store className="h-8 w-8" />
          {t('merchant.dashboard.title') || 'Merchant Account'}
        </h1>
        <p className="text-muted-foreground">
          {t('merchant.dashboard.description') || 'Manage your Stripe payment processing account'}
        </p>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('merchant.dashboard.cards.paymentProcessing') || 'Payment Processing'}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t('merchant.dashboard.cards.paymentProcessingDesc') || 'Accept payments through Stripe Connect'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('merchant.dashboard.cards.verification') || 'Account Verification'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t('merchant.dashboard.cards.verificationDesc') || 'Complete identity and business verification'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('merchant.dashboard.cards.compliance') || 'Compliance'}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t('merchant.dashboard.cards.complianceDesc') || 'Meet regulatory requirements'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Status Display */}
      <Card>
        <CardHeader>
          <CardTitle>{t('merchant.dashboard.status.title') || 'Account Status'}</CardTitle>
          <CardDescription>
            {t('merchant.dashboard.status.description') || 'Current status of your merchant account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MerchantStatusDisplay />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">
            {t('merchant.dashboard.help.title') || 'Need Help?'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>{t('merchant.dashboard.help.onboarding') || 'Onboarding Issues:'}:</strong>{' '}
              {t('merchant.dashboard.help.onboardingDesc') || 'Contact Stripe support for verification issues'}
            </p>
            <p>
              <strong>{t('merchant.dashboard.help.deletedAccount') || 'Deleted Account:'}:</strong>{' '}
              {t('merchant.dashboard.help.deletedAccountDesc') || 'Use the recreation option to create a new account'}
            </p>
            <p>
              <strong>{t('merchant.dashboard.help.payouts') || 'Payouts:'}:</strong>{' '}
              {t('merchant.dashboard.help.payoutsDesc') || 'Manage payouts directly in your Stripe dashboard'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
