import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Fleetros Backoffice',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple passthrough layout - let the page handle its own styling
  return <>{children}</>;
}
