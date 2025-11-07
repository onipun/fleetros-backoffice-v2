'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserInfo } from '@/hooks/use-user-info';
import { merchantAPI, MerchantStatus } from '@/lib/api/merchant-api';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Merchant Onboarding Complete Page
 * This is the return URL where Stripe redirects merchants after completing onboarding
 * Shows the merchant account status and next steps
 */
export default function MerchantOnboardingCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: userInfo, isLoading: isLoadingUser } = useUserInfo();
  const [status, setStatus] = useState<MerchantStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMerchantStatus = async () => {
      try {
        // Wait for user info to be loaded
        if (isLoadingUser || !userInfo) {
          return;
        }

        // Fetch merchant status from the API with proper authorization
        const merchantStatus = await merchantAPI.getMerchantStatus();
        setStatus(merchantStatus);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching merchant status:', err);
        setError(err.message || 'Failed to load merchant information');
        setIsLoading(false);
      }
    };

    fetchMerchantStatus();
  }, [userInfo, isLoadingUser]);

  if (isLoading || isLoadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your merchant status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/merchant/onboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Start Onboarding
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = () => {
    if (status?.canAcceptPayments) return 'text-green-600';
    if (status?.onboardingStatus === 'PENDING_VERIFICATION') return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getStatusMessage = () => {
    if (status?.canAcceptPayments) {
      return 'Your merchant account is fully active and ready to accept payments!';
    }
    if (status?.onboardingStatus === 'PENDING_VERIFICATION') {
      return 'Your information has been submitted and is currently being verified by Stripe.';
    }
    if (status?.onboardingStatus === 'INCOMPLETE') {
      return 'Additional information is required to complete your onboarding.';
    }
    return 'Your onboarding process has been started.';
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/merchant')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Merchant
        </Button>
        <h1 className="text-3xl font-bold">Merchant Onboarding Complete</h1>
        <p className="text-muted-foreground">
          Track your payment account setup progress
        </p>
      </div>

      {/* Status Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <CheckCircle2 className={`h-6 w-6 ${getStatusColor()}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Welcome back!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {getStatusMessage()}
              </p>
              {status && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <span className={getStatusColor()}>{status.onboardingStatus}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Charges Enabled:</span>
                    <span className={status.chargesEnabled ? 'text-green-600' : 'text-gray-600'}>
                      {status.chargesEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Payouts Enabled:</span>
                    <span className={status.payoutsEnabled ? 'text-green-600' : 'text-gray-600'}>
                      {status.payoutsEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            What you can do now
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>
            Common questions about the merchant onboarding process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">How long does verification take?</h4>
            <p className="text-sm text-muted-foreground">
              Most accounts are verified within a few hours. Complex cases may take 1-2 business days.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">What if I need to update information?</h4>
            <p className="text-sm text-muted-foreground">
              You can return to the merchant onboarding page to update your details at any time.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">When can I start accepting payments?</h4>
            <p className="text-sm text-muted-foreground">
              Once your charges are enabled (shown above), you can immediately start processing payments.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">How do I check my merchant status?</h4>
            <p className="text-sm text-muted-foreground">
              Visit the Merchant dashboard to view your current status at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
