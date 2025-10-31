'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { registerMerchant } from '@/lib/api/stripe-onboarding';
import {
  defaultRegistrationValues,
  merchantRegistrationSchema,
  type MerchantRegistrationFormData,
} from '@/lib/validations/stripe-onboarding';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Building2, Globe, Loader2, MapPin, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface RegistrationFormProps {
  onSuccess?: (businessAccountId: string, onboardingUrl: string) => void;
  returnUrl?: string;
  refreshUrl?: string;
}

/**
 * Merchant Registration Form
 * Simplified form based on updated API specification
 * Collects: email, businessName, country, phone (optional), website (optional)
 */
export function MerchantRegistrationForm({ onSuccess, returnUrl, refreshUrl }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { toast, error: toastError, success: toastSuccess } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<MerchantRegistrationFormData>({
    resolver: zodResolver(merchantRegistrationSchema),
    defaultValues: defaultRegistrationValues,
  });

  // Fetch user information and accountId on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user information');
        }

        const userData = await response.json();
        
        if (!userData.authenticated) {
          throw new Error('User not authenticated');
        }

        // Set accountId and email from user data
        setAccountId(userData.accountId);
        setUserEmail(userData.email || '');
        
        // Pre-fill business name if available
        if (userData.accountName) {
          setValue('businessName', userData.accountName);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch user info:', err);
        setError(err.message || 'Failed to load user information');
        setIsLoading(false);
        
        toastError(
          'Failed to Load User Information',
          'Unable to fetch your account details. Please refresh the page and try again.'
        );
      }
    };

    fetchUserInfo();
  }, [setValue, toastError]);

  const onSubmit = async (data: MerchantRegistrationFormData) => {
    if (!accountId) {
      toastError(
        'Account Not Loaded',
        'Your account information is not available. Please refresh the page and try again.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Add businessAccountId to the request
      const requestData = {
        ...data,
        businessAccountId: accountId,
      };

      const response = await registerMerchant(requestData);

      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }

      toastSuccess(
        'Registration Successful!',
        'Redirecting you to Stripe to complete your account setup...'
      );

      // Store businessAccountId in localStorage for later reference
      localStorage.setItem('businessAccountId', response.businessAccountId);

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess(response.businessAccountId, response.onboardingUrl);
      } else {
        // Redirect to Stripe onboarding
        window.location.href = response.onboardingUrl;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toastError(
        'Registration Failed',
        error.message || 'Unable to register your merchant account. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading your account information...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Error Loading Account</h4>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && accountId && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Provide your business details to set up payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Info Display */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="text-sm">
              <p className="font-medium">Account Information</p>
              <p className="text-muted-foreground mt-1">Email: {userEmail}</p>
              <p className="text-muted-foreground">Account ID: {accountId}</p>
            </div>
          </div>

          {/* Business Name */}
          <FormField
            label="Business Name"
            htmlFor="businessName"
            icon={<Building2 className="h-4 w-4" />}
            required
            error={errors.businessName?.message}
          >
            <Input
              id="businessName"
              placeholder="Acme Corporation"
              {...register('businessName')}
              disabled={isSubmitting}
              error={!!errors.businessName}
            />
          </FormField>

          {/* Country */}
          <FormField
            label="Country Code"
            htmlFor="country"
            icon={<MapPin className="h-4 w-4" />}
            required
            error={errors.country?.message}
            hint="2-letter ISO country code (e.g., US, MY, SG)"
          >
            <Input
              id="country"
              placeholder="US, MY, SG, etc."
              maxLength={2}
              {...register('country')}
              disabled={isSubmitting}
              className="uppercase"
              error={!!errors.country}
            />
          </FormField>

          {/* Phone (Optional) */}
          <FormField
            label="Phone Number"
            htmlFor="phone"
            icon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
          >
            <Input
              id="phone"
              type="tel"
              placeholder="+60123456789"
              {...register('phone')}
              disabled={isSubmitting}
              error={!!errors.phone}
            />
          </FormField>

          {/* Website (Optional) */}
          <FormField
            label="Website"
            htmlFor="website"
            icon={<Globe className="h-4 w-4" />}
            error={errors.website?.message}
          >
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              {...register('website')}
              disabled={isSubmitting}
              error={!!errors.website}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Processing...' : 'Continue to Stripe'}
        </Button>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>You'll be redirected to Stripe to complete your account setup</li>
              <li>Provide additional verification details required by Stripe</li>
              <li>Once verified, you can start accepting payments</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </form>
      )}
    </>
  );
}
