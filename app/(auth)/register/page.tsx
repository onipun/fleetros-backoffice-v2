'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { registerMasterAccount } from '@/lib/api/registration';
import { preventEnterSubmission } from '@/lib/form-utils';
import { Building2, Eye, EyeOff, Globe, Lock, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RegisterFormData {
  accountName: string;
  accountDescription: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  companyName: string;
  country: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    accountName: '',
    accountDescription: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    companyName: '',
    country: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  // Supported countries - limited to Southeast Asian markets
  const countryOptions = [
    { value: 'MY', label: 'Malaysia' },
    { value: 'SG', label: 'Singapore' },
    { value: 'ID', label: 'Indonesia' },
    { value: 'TH', label: 'Thailand' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    // Required fields
    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!*()\-_.,?])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one digit, one lowercase, one uppercase, and one special character (@#$%^&+=!*()-_.,?)';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { confirmPassword, ...registrationData } = formData;

      const result = await registerMasterAccount(registrationData);

      if (!result.success) {
        // If there are field-specific validation errors, set them
        if (result.details) {
          const backendErrors: Partial<Record<keyof RegisterFormData, string>> = {};
          Object.entries(result.details).forEach(([field, message]) => {
            backendErrors[field as keyof RegisterFormData] = message as string;
          });
          setErrors(backendErrors);
        }

        // Show toast with general error
        toast({
          title: 'Registration Failed',
          description: result.error || 'Please check the form for errors.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Registration Successful',
        description: result.message || 'Please check your email to verify your account.',
        variant: 'default',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 py-12"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--background)) 50%, hsl(var(--accent) / 0.08) 100%)',
      }}
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      
      <Card className="relative w-full max-w-4xl z-10 shadow-xl border-border/50 backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight">Create Master Account</CardTitle>
              <CardDescription className="text-base">
                Register your business to start managing your fleet with Fleetros
              </CardDescription>
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg">
              <Building2 className="h-7 w-7" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmission} className="space-y-6">
            {/* Business Information */}
            <div className="space-y-4 p-6 border rounded-xl bg-gradient-to-br from-muted/30 to-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Business Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName" className="text-sm font-medium">
                    Account Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="accountName"
                    name="accountName"
                    placeholder="e.g., Luxury Car Rentals Inc"
                    value={formData.accountName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`h-11 ${errors.accountName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {errors.accountName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-xs">⚠</span> {errors.accountName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder="Legal company name"
                    value={formData.companyName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`h-11 ${errors.companyName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-xs">⚠</span> {errors.companyName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountDescription" className="text-sm font-medium">Account Description</Label>
                <Textarea
                  id="accountDescription"
                  name="accountDescription"
                  placeholder="Brief description of your business (optional)"
                  value={formData.accountDescription}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Country <span className="text-destructive">*</span>
                </Label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${errors.country ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                >
                  <option value="" disabled>
                    Select your country
                  </option>
                  {countryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="text-xs">⚠</span> {errors.country}
                  </p>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4 p-6 border rounded-xl bg-gradient-to-br from-muted/30 to-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Your Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`h-11 ${errors.firstName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-xs">⚠</span> {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`h-11 ${errors.lastName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-xs">⚠</span> {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+60123456789"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 ${errors.phoneNumber ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="text-xs">⚠</span> {errors.phoneNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Account Credentials */}
            <div className="space-y-4 p-6 border rounded-xl bg-gradient-to-br from-muted/30 to-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Account Credentials</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="john.admin"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="username"
                    className={`h-11 ${errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-xs">⚠</span> {errors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@luxurycars.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="email"
                    className={`h-11 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-xs">⚠</span> {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className={`h-11 pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-xs">⚠</span> {errors.password}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      8+ characters with digit, lowercase, uppercase & special character
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className={`h-11 pr-10 ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="text-xs">⚠</span> {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Your Account...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-5 w-5" />
                    Create Master Account
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>

              <Link href="/login" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base font-medium"
                  disabled={isLoading}
                >
                  Sign In Instead
                </Button>
              </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-2 leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline font-medium">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
