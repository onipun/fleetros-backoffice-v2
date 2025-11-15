'use client';

import { DashboardStatistics } from '@/components/dashboard/dashboard-statistics';
import { EventCalendar } from '@/components/dashboard/event-calendar';
import { RevenueReport } from '@/components/dashboard/revenue-report';
import { MerchantSetupWidget } from '@/components/merchant/merchant-setup-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMerchantStatus } from '@/lib/api/stripe-onboarding';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  const [isLoadingMerchantStatus, setIsLoadingMerchantStatus] = useState(true);
  const [accountId, setAccountId] = useState<number | null>(null);

  useEffect(() => {
    const checkMerchantStatus = async () => {
      try {
        // Get user account ID from /api/auth/me
        const authResponse = await fetch('/api/auth/me');
        
        if (!authResponse.ok) {
          return; // User not authenticated, don't show banner
        }

        const userData = await authResponse.json();
        
        if (!userData.authenticated || !userData.accountId) {
          return;
        }

        // Set account ID for reporting
        setAccountId(userData.accountId);

        // Check merchant status
        try {
          const merchantStatus = await getMerchantStatus();
          
          // Show banner if merchant doesn't exist or can't accept payments
          if (!merchantStatus.success || !merchantStatus.canAcceptPayments) {
            setShowPaymentBanner(true);
          }
        } catch (error: any) {
          // If 404 (merchant not found), show banner
          if (error.status === 404) {
            setShowPaymentBanner(true);
          }
        }
      } catch (error) {
        console.error('Error checking merchant status:', error);
      } finally {
        setIsLoadingMerchantStatus(false);
      }
    };

    checkMerchantStatus();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your fleet.
        </p>
      </div>

      {/* Payment Setup Widget */}
      {showPaymentBanner && !isLoadingMerchantStatus && (
        <MerchantSetupWidget showDetails={false} compact={false} />
      )}

      {/* Dashboard Statistics from Reporting Service */}
      {accountId && (
        <DashboardStatistics accountId={accountId} />
      )}

      {/* Revenue Report from Reporting Service */}
      {accountId && (
        <RevenueReport accountId={accountId} />
      )}

      <EventCalendar />
    </div>
  );
}
