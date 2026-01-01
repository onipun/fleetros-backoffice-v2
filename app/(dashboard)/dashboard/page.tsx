'use client';

import { DashboardStatistics } from '@/components/dashboard/dashboard-statistics';
import { EventCalendar } from '@/components/dashboard/event-calendar';
import { RevenueReport } from '@/components/dashboard/revenue-report';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [accountId, setAccountId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAccountId = async () => {
      try {
        // Get user account ID from /api/auth/me
        const authResponse = await fetch('/api/auth/me');
        
        if (!authResponse.ok) {
          return;
        }

        const userData = await authResponse.json();
        
        if (userData.authenticated && userData.accountId) {
          setAccountId(userData.accountId);
        }
      } catch (error) {
        console.error('Error fetching account ID:', error);
      }
    };

    fetchAccountId();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your fleet.
        </p>
      </div>

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
