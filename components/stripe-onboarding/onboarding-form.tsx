/**
 * @deprecated Use MerchantRegistrationForm instead
 * This component is kept for backward compatibility but now uses the simplified form
 */

import { MerchantRegistrationForm } from './registration-form';

interface OnboardingFormProps {
  onSuccess?: (businessAccountId: string, onboardingUrl: string) => void;
  returnUrl?: string;
  refreshUrl?: string;
}

/**
 * @deprecated Use MerchantRegistrationForm from './registration-form' instead
 * This is a compatibility wrapper that redirects to the new simplified registration form
 */
export function OnboardingForm(props: OnboardingFormProps) {
  return <MerchantRegistrationForm {...props} />;
}
