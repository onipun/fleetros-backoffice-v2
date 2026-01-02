'use client';

import { DashboardStatistics } from '@/components/dashboard/dashboard-statistics';
import { EventCalendar } from '@/components/dashboard/event-calendar';
import { RevenueReport } from '@/components/dashboard/revenue-report';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your fleet.
        </p>
      </div>

      {/* Dashboard Statistics from Reporting Service */}
      <DashboardStatistics />

      {/* Revenue Report from Reporting Service */}
      <RevenueReport />

      <EventCalendar />
    </div>
  );
}
