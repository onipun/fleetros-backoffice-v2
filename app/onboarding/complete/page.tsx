'use client';

import { OnboardingStatusDashboard } from '@/components/stripe-onboarding/onboarding-status-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Stripe Onboarding Complete Page
 * This is the return URL where Stripe redirects users after completing onboarding
 * Documentation: FRONTEND_FLOW_DIAGRAMS.md - Section 1 & 3
 */
export default function OnboardingCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [businessAccountId, setBusinessAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountId = async () => {
      try {
        // Try to get businessAccountId from localStorage first
        const storedAccountId = localStorage.getItem('businessAccountId');
        
        if (storedAccountId) {
          setBusinessAccountId(storedAccountId);
          setIsLoading(false);
          return;
        }

        // If not in localStorage, fetch from /api/auth/me
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user information');
        }

        const userData = await response.json();
        
        if (!userData.authenticated || !userData.accountId) {
          throw new Error('User not authenticated or account ID not found');
        }

        setBusinessAccountId(userData.accountId);
        localStorage.setItem('businessAccountId', userData.accountId);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching account ID:', err);
        setError(err.message || 'Failed to load account information');
        setIsLoading(false);
      }
    };

    fetchAccountId();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your onboarding status...</p>
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
              <Button onClick={() => router.push('/payments/onboarding')}>
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

  if (!businessAccountId) {
    return null;
  }

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Payment Onboarding Complete</h1>
        <p className="text-muted-foreground">
          Track your payment account setup progress
        </p>
      </div>

      {/* Welcome Back Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Welcome back!</h3>
              <p className="text-sm text-muted-foreground">
                Your onboarding information has been submitted to Stripe. The verification
                process typically takes a few minutes to a few hours. Your status will update
                automatically below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Dashboard */}
      <OnboardingStatusDashboard
        businessAccountId={businessAccountId}
        autoRefresh={true}
        refreshInterval={30000}
      />

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>
            Common questions about the onboarding process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">How long does verification take?</h4>
            <p className="text-sm text-muted-foreground">
              Most accounts are verified within a few hours. Complex cases may take 1-2
              business days.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">What if I need to update information?</h4>
            <p className="text-sm text-muted-foreground">
              You can click "Continue Onboarding" above to return to Stripe and update your
              details at any time.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">When can I start accepting payments?</h4>
            <p className="text-sm text-muted-foreground">
              Once your account shows "Payment Ready" status above, you can immediately
              start processing payments.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
