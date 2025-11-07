'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useUserInfo } from '@/hooks/use-user-info';
import { merchantAPI, type OnboardingRequest } from '@/lib/api/merchant-api';
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RecreateAccountPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Use cached user info hook
  const { data: userInfo } = useUserInfo();

  const countryOptions = [
    { value: 'MY', label: t('merchant.common.countries.MY') || 'Malaysia (MY)' },
    { value: 'SG', label: t('merchant.common.countries.SG') || 'Singapore (SG)' },
    { value: 'US', label: t('merchant.common.countries.US') || 'United States (US)' },
    { value: 'GB', label: t('merchant.common.countries.GB') || 'United Kingdom (GB)' },
    { value: 'AU', label: t('merchant.common.countries.AU') || 'Australia (AU)' },
  ];

  const [formData, setFormData] = useState<OnboardingRequest>({
    country: 'MY',
    email: '',
    businessName: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form when user info is loaded
  useEffect(() => {
    if (userInfo) {
      setFormData({
        country: userInfo.country || 'MY',
        email: userInfo.email || '',
        businessName: userInfo.companyName || '',
        phone: userInfo.phoneNumber || '',
      });
    }
  }, [userInfo]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.country) {
      newErrors.country = t('merchant.recreate.errors.countryRequired') || 'Country is required';
    }

    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = t('merchant.recreate.errors.emailRequired') || 'Valid email is required for recreation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await merchantAPI.recreateDeletedAccount(formData);

      toast({
        title: t('merchant.recreate.success.title') || 'Account Recreated',
        description: result.message || t('merchant.recreate.success.description') || 'Your new Stripe account has been created',
      });

      // Redirect to Stripe onboarding
      setTimeout(() => {
        window.location.href = result.onboardingUrl;
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to recreate account';
      
      toast({
        title: t('merchant.recreate.error.title') || 'Recreation Error',
        description: errorMessage,
        variant: 'destructive',
      });

      setLoading(false);
    }
  };

  const handleChange = (field: keyof OnboardingRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/merchant">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back') || 'Back'}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RefreshCw className="h-8 w-8" />
            {t('merchant.recreate.title') || 'Recreate Stripe Account'}
          </h1>
          <p className="text-muted-foreground">
            {t('merchant.recreate.description') || 'Create a new Stripe account to continue accepting payments'}
          </p>
        </div>
      </div>

      {/* Warning Card */}
      <Card className="max-w-2xl border-yellow-400 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            {t('merchant.recreate.warning.title') || 'Important Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-yellow-700">
            <li>{t('merchant.recreate.warning.point1') || 'Your previous Stripe account was deleted or revoked'}</li>
            <li>{t('merchant.recreate.warning.point2') || 'A new Stripe account will be created with a new account ID'}</li>
            <li>{t('merchant.recreate.warning.point3') || 'You will need to complete the onboarding process again'}</li>
            <li>{t('merchant.recreate.warning.point4') || 'Previous transaction history will not be transferred'}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('merchant.recreate.form.title') || 'New Account Information'}</CardTitle>
          <CardDescription>
            {t('merchant.recreate.form.description') || 'Provide details for your new merchant account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Country */}
            <FormField
              label={t('merchant.recreate.form.country') || 'Country'}
              error={errors.country}
              required
              htmlFor="country"
            >
              <select
                id="country"
                value={formData.country}
                onChange={handleChange('country')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loading}
              >
                {countryOptions.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Email */}
            <FormField
              label={t('merchant.recreate.form.email') || 'Email'}
              error={errors.email}
              required
              htmlFor="email"
              hint={t('merchant.recreate.form.emailHint') || 'Email is required for account recreation'}
            >
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder={t('merchant.recreate.form.emailPlaceholder') || 'merchant@example.com'}
                disabled={loading}
                required
              />
            </FormField>

            {/* Business Name */}
            <FormField
              label={t('merchant.recreate.form.businessName') || 'Business Name'}
              error={errors.businessName}
              htmlFor="businessName"
              hint={t('merchant.recreate.form.businessNameHint') || 'Optional'}
            >
              <Input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleChange('businessName')}
                placeholder={t('merchant.recreate.form.businessNamePlaceholder') || 'My Business Inc.'}
                disabled={loading}
              />
            </FormField>

            {/* Phone */}
            <FormField
              label={t('merchant.recreate.form.phone') || 'Phone Number'}
              error={errors.phone}
              htmlFor="phone"
              hint={t('merchant.recreate.form.phoneHint') || 'Optional'}
            >
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder={t('merchant.common.placeholders.phone') || '+60134845807'}
                disabled={loading}
              />
            </FormField>

            {/* Submit Button */}
            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('merchant.recreate.form.submit') || 'Create New Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="max-w-2xl border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">
            {t('merchant.recreate.info.title') || 'What happens next?'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>{t('merchant.recreate.info.step1') || 'A new Stripe account will be created'}</li>
            <li>{t('merchant.recreate.info.step2') || 'You will be redirected to Stripe onboarding'}</li>
            <li>{t('merchant.recreate.info.step3') || 'Complete the verification process'}</li>
            <li>{t('merchant.recreate.info.step4') || 'Your new account will be ready to accept payments'}</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
