'use client';

import { CustomerLoyaltyViewer } from '@/components/loyalty/customer-loyalty-viewer';

export default function CustomerLoyaltyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Loyalty Accounts</h1>
        <p className="text-muted-foreground">
          View customer loyalty accounts, points balance, and transaction history
        </p>
      </div>
      <CustomerLoyaltyViewer />
    </div>
  );
}
