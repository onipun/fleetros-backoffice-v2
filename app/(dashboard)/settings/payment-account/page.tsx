'use client';

import { MerchantSetupWidget } from '@/components/merchant/merchant-setup-widget';
import { OnboardingStatusDashboard } from '@/components/stripe-onboarding/onboarding-status-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { canAcceptPayments, hasCompletedOnboarding } from '@/lib/api/stripe-onboarding';
import { CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaymentAccountPage() {
  const router = useRouter();
  const [businessAccountId, setBusinessAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [canAcceptPayment, setCanAcceptPayment] = useState(false);

  useEffect(() => {
    // Check if user has started onboarding
    const accountId = localStorage.getItem('businessAccountId');
    setBusinessAccountId(accountId);
    
    if (accountId) {
      checkOnboardingStatus(accountId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkOnboardingStatus = async (accountId: string) => {
    setIsChecking(true);
    try {
      const [completed, canPay] = await Promise.all([
        hasCompletedOnboarding(),
        canAcceptPayments(),
      ]);
      setOnboardingComplete(completed);
      setCanAcceptPayment(canPay);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setIsLoading(false);
      setIsChecking(false);
    }
  };

  const handleStartOnboarding = () => {
    router.push('/payments/onboarding');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading payment account...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Payment Account</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your payment processing account and settings
        </p>
      </div>

      {/* Merchant Setup Widget - New Integration */}
      <MerchantSetupWidget showDetails={true} />

      {/* Legacy Support - Show old onboarding if businessAccountId exists */}
      {businessAccountId && (
        <>
          {/* Payment Capability Status */}
          {canAcceptPayment && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Payment Processing Active</h3>
                    <p className="text-sm text-muted-foreground">
                      Your account is ready to accept payments from customers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Onboarding Status Dashboard */}
          <OnboardingStatusDashboard
            businessAccountId={businessAccountId}
            autoRefresh={!canAcceptPayment}
            refreshInterval={30000}
          />

          {/* Payment Features */}
          {canAcceptPayment && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Features</CardTitle>
                <CardDescription>
                  Available payment processing capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">💳 Card Payments</h4>
                    <p className="text-sm text-muted-foreground">
                      Accept Visa, Mastercard, Amex, and other major cards
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">🔄 Automatic Payouts</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive funds directly to your bank account
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">💰 Refunds</h4>
                    <p className="text-sm text-muted-foreground">
                      Process full or partial refunds to customers
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">📊 Reporting</h4>
                    <p className="text-sm text-muted-foreground">
                      Track transactions and view detailed analytics
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">🔒 Security</h4>
                    <p className="text-sm text-muted-foreground">
                      PCI-DSS Level 1 certified payment processing
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">🌍 Multi-Currency</h4>
                    <p className="text-sm text-muted-foreground">
                      Accept payments in multiple currencies
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Payment processing issues?</strong> Contact our support team or check
            your Stripe dashboard for more details.
          </p>
          <p>
            <strong>Questions about fees?</strong> View our{' '}
            <a href="#" className="text-primary hover:underline">
              pricing page
            </a>{' '}
            for detailed information about transaction fees.
          </p>
          <p>
            <strong>Security concerns?</strong> All payments are processed securely through
            Stripe, a PCI-compliant payment processor trusted by millions of businesses
            worldwide.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
