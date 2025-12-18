'use client';

import { CustomerSpendingViewer } from '@/components/dashboard/customer-spending-viewer';

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <CustomerSpendingViewer />
    </div>
  );
}
