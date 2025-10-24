import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Fleetros Backoffice',
};

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
