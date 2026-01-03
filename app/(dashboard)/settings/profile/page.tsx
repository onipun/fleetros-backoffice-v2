'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
    getAccountStatusLabel,
    getMerchantProfile,
    getOnboardingStatusLabel,
    isPaymentGatewayReady,
    patchMerchantProfile,
    type MerchantProfileRequest,
    type MerchantProfileResponse,
} from '@/lib/api/merchant-profile-api';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    CreditCard,
    Edit2,
    ExternalLink,
    Globe,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Save,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Supported countries - limited to Southeast Asian markets
const COUNTRY_OPTIONS = [
  { value: 'MY', label: 'Malaysia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'TH', label: 'Thailand' },
];

export default function MerchantProfilePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<MerchantProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<MerchantProfileRequest>({
    companyName: '',
    description: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    city: '',
    country: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMerchantProfile();
      setProfile(data);
      setFormData({
        companyName: data.companyName || '',
        description: data.description || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        addressLine1: data.addressLine1 || '',
        city: data.city || '',
        country: data.country || '',
      });
    } catch (err: any) {
      console.error('Error loading merchant profile:', err);
      setError(err.message || 'Failed to load merchant profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MerchantProfileRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Exclude email from update - email is read-only
      const { email, ...updateData } = formData;
      const updated = await patchMerchantProfile(updateData);
      setProfile(updated);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || '',
        description: profile.description || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        addressLine1: profile.addressLine1 || '',
        city: profile.city || '',
        country: profile.country || '',
      });
    }
    setIsEditing(false);
  };

  const getPaymentStatusBadge = () => {
    if (!profile) return null;
    
    if (!profile.hasPaymentGatewayAccount) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Not Configured</Badge>;
    }
    
    if (isPaymentGatewayReady(profile)) {
      return <Badge className="bg-green-100 text-green-700">Ready</Badge>;
    }
    
    if (profile.paymentGatewayAccountStatus === 'RESTRICTED') {
      return <Badge variant="destructive">Restricted</Badge>;
    }
    
    return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Error Loading Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <Button onClick={loadProfile} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">
              {t('settings.profile.title')}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('settings.profile.description')}
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Your business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                {isEditing ? (
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter company name"
                  />
                ) : (
                  <p className="text-sm font-medium">{profile.companyName || '-'}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your business"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile.description || 'No description provided'}
                  </p>
                )}
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {/* Email is read-only - cannot be changed through profile update */}
                  <p className="text-sm">{profile.email || '-'}</p>
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed here. Contact support to update your email.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="+1-555-123-4567"
                    />
                  ) : (
                    <p className="text-sm">{profile.phoneNumber || '-'}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Address Information */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                
                <div className="space-y-2">
                  <Label htmlFor="addressLine1" className="text-xs text-muted-foreground">
                    Street Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  ) : (
                    <p className="text-sm">{profile.addressLine1 || '-'}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs text-muted-foreground">
                      City
                    </Label>
                    {isEditing ? (
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                      />
                    ) : (
                      <p className="text-sm">{profile.city || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-xs text-muted-foreground flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      Country
                    </Label>
                    {isEditing ? (
                      <select
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>
                          Select country
                        </option>
                        {COUNTRY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm">
                        {COUNTRY_OPTIONS.find(c => c.value === profile.country)?.label || profile.country || '-'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Type</span>
                <Badge variant="outline">{profile.accountType}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('common.status') || 'Status'}</span>
                <Badge className={
                  profile.accountStatus === 'ACTIVE' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }>
                  {profile.accountStatus}
                </Badge>
              </div>
              {profile.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Gateway Status Card */}
          <Card className={
            isPaymentGatewayReady(profile) 
              ? 'border-green-200' 
              : profile.hasPaymentGatewayAccount 
                ? 'border-yellow-200' 
                : 'border-gray-200'
          }>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Gateway
                </span>
                {getPaymentStatusBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.hasPaymentGatewayAccount ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Onboarding</span>
                      <span className="text-sm font-medium">
                        {getOnboardingStatusLabel(profile.paymentGatewayOnboardingStatus)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Account Status</span>
                      <span className="text-sm font-medium">
                        {getAccountStatusLabel(profile.paymentGatewayAccountStatus)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2">
                      {profile.chargesEnabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm">
                        {profile.chargesEnabled ? 'Charges Enabled' : 'Charges Pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.payoutsEnabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm">
                        {profile.payoutsEnabled ? 'Payouts Enabled' : 'Payouts Pending'}
                      </span>
                    </div>
                  </div>

                  {profile.gatewayAccountId && (
                    <div className="pt-2">
                      <span className="text-xs text-muted-foreground">Gateway ID</span>
                      <code className="block text-xs bg-muted px-2 py-1 rounded mt-1">
                        {profile.gatewayAccountId}
                      </code>
                    </div>
                  )}

                  {profile._links['gateway-dashboard'] && profile.chargesEnabled && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => window.open(profile._links['gateway-dashboard']?.href, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Stripe Dashboard
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    No payment gateway account configured. Set up your payment account to start accepting payments.
                  </p>
                  <Link href="/settings/payment-account">
                    <Button className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Set Up Payment Account
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/settings/payment-account" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Account Settings
                </Button>
              </Link>
              <Link href="/settings/account-settings" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  <Building2 className="mr-2 h-4 w-4" />
                  Account Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
