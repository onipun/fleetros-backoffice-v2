'use client';

interface MerchantStatusBadgeProps {
  status: string;
}

const STATUS_STYLES = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  ACCOUNT_DELETED: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-orange-100 text-orange-800',
  ENABLED: 'bg-emerald-100 text-emerald-800',
  DISABLED: 'bg-gray-100 text-gray-800',
  DELETED: 'bg-red-100 text-red-800',
} as const;

export function MerchantStatusBadge({ status }: MerchantStatusBadgeProps) {
  const normalizedStatus = status.toUpperCase().replace(/ /g, '_');
  const style = STATUS_STYLES[normalizedStatus as keyof typeof STATUS_STYLES] || STATUS_STYLES.NOT_STARTED;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
