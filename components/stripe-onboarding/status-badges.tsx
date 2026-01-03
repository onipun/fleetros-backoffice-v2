'use client';

import { Badge } from '@/components/ui/badge';
import { AccountStatus, OnboardingStatus } from '@/types/stripe-onboarding';
import { AlertCircle, CheckCircle2, Clock, Loader2, Trash2, XCircle } from 'lucide-react';

interface OnboardingStatusBadgeProps {
  onboardingStatus: OnboardingStatus;
  accountStatus?: AccountStatus;
  chargesEnabled?: boolean;
  className?: string;
}

export function OnboardingStatusBadge({
  onboardingStatus,
  accountStatus,
  chargesEnabled,
  className,
}: OnboardingStatusBadgeProps) {
  const getStatusConfig = () => {
    // If charges are enabled, show verified
    if (chargesEnabled && onboardingStatus === OnboardingStatus.VERIFIED) {
      return {
        label: 'Payment Ready',
        icon: CheckCircle2,
        variant: 'default' as const,
        className: 'bg-green-500 text-white hover:bg-green-600',
      };
    }

    // Based on onboarding status
    switch (onboardingStatus) {
      case OnboardingStatus.NOT_STARTED:
        return {
          label: 'Not Started',
          icon: AlertCircle,
          variant: 'secondary' as const,
          className: 'bg-gray-500 text-white',
        };
      
      case OnboardingStatus.IN_PROGRESS:
        return {
          label: 'In Progress',
          icon: Clock,
          variant: 'default' as const,
          className: 'bg-blue-500 text-white',
        };
      
      case OnboardingStatus.COMPLETED:
        return {
          label: 'Under Review',
          icon: Loader2,
          variant: 'default' as const,
          className: 'bg-yellow-500 text-white',
        };
      
      case OnboardingStatus.VERIFIED:
        return {
          label: 'Verified',
          icon: CheckCircle2,
          variant: 'default' as const,
          className: 'bg-green-500 text-white',
        };
      
      case OnboardingStatus.FAILED:
        return {
          label: 'Failed',
          icon: XCircle,
          variant: 'destructive' as const,
          className: 'bg-red-500 text-white',
        };
      
      case OnboardingStatus.ACCOUNT_DELETED:
        return {
          label: 'Account Deleted',
          icon: Trash2,
          variant: 'destructive' as const,
          className: 'bg-red-600 text-white',
        };
      
      default:
        return {
          label: 'Unknown',
          icon: AlertCircle,
          variant: 'secondary' as const,
          className: 'bg-gray-500 text-white',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      <Icon className={`mr-1 h-3 w-3 ${onboardingStatus === OnboardingStatus.COMPLETED ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}

interface AccountStatusBadgeProps {
  accountStatus: AccountStatus;
  className?: string;
}

export function AccountStatusBadge({
  accountStatus,
  className,
}: AccountStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (accountStatus) {
      case AccountStatus.ENABLED:
        return {
          label: 'Enabled',
          variant: 'default' as const,
          className: 'bg-green-500 text-white',
        };
      
      case AccountStatus.PENDING:
        return {
          label: 'Pending',
          variant: 'secondary' as const,
          className: 'bg-yellow-500 text-white',
        };
      
      case AccountStatus.RESTRICTED:
        return {
          label: 'Restricted',
          variant: 'destructive' as const,
          className: 'bg-orange-500 text-white',
        };
      
      case AccountStatus.RESTRICTED_SOON:
        return {
          label: 'Action Required',
          variant: 'destructive' as const,
          className: 'bg-orange-400 text-white',
        };
      
      case AccountStatus.REJECTED:
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          className: 'bg-red-500 text-white',
        };
      
      case AccountStatus.DELETED:
        return {
          label: 'Deleted',
          variant: 'destructive' as const,
          className: 'bg-red-600 text-white',
        };
      
      default:
        return {
          label: accountStatus,
          variant: 'secondary' as const,
          className: 'bg-gray-500 text-white',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
}
