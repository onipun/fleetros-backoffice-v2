'use client';

import { MerchantRegistrationForm } from '@/components/stripe-onboarding/registration-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function PaymentOnboardingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Payment Account Setup</h1>
        </div>
        <p className="text-muted-foreground">
          Set up your payment account to start accepting payments from customers
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">What happens next?</CardTitle>
          <CardDescription>
            Follow these steps to complete your payment setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <strong>Provide business information</strong> - Fill in your business details
                below (simplified form)
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <strong>Complete Stripe onboarding</strong> - You'll be redirected to Stripe to
                verify your identity and banking details
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                3
              </div>
              <div>
                <strong>Start accepting payments</strong> - Once approved, you can immediately
                start processing payments
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Registration Form */}
      <MerchantRegistrationForm />
    </div>
  );
}
