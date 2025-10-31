'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { acceptInvitation } from '@/lib/api/team-management';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, Lock, Phone, User, UserPlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const acceptInvitationSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [accountName, setAccountName] = useState('');
  const { success, error } = useToast();
  
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
  });

  useEffect(() => {
    if (!token) {
      error('Invalid invitation', 'No invitation token found in URL');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [token, error, router]);

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!token) return;

    setIsSubmitting(true);
    
    const result = await acceptInvitation({
      invitationToken: token,
      username: data.username,
      password: data.password,
      phoneNumber: data.phoneNumber,
    });

    if (result.success && result.data) {
      setAccountName(result.data.accountName);
      setIsSuccess(true);
      success('Welcome!', `Successfully joined ${result.data.accountName}`);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      error('Failed to accept invitation', result.error || 'An error occurred');
    }
    
    setIsSubmitting(false);
  };

  if (!token) {
    return (
      <div className="container max-w-md mx-auto py-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>
              The invitation link is invalid or missing. You will be redirected to the login page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container max-w-md mx-auto py-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-6 w-6" />
              Welcome to {accountName}!
            </CardTitle>
            <CardDescription>
              Your account has been created successfully. You will be redirected to the login page in a few seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-20">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Accept Invitation
          </CardTitle>
          <CardDescription>
            Create your account credentials to join the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="Username"
              htmlFor="username"
              icon={<User className="h-4 w-4" />}
              required
              error={errors.username?.message}
              hint="Choose a unique username (min 3 characters)"
            >
              <Input
                id="username"
                placeholder="johndoe"
                {...register('username')}
                error={!!errors.username}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              icon={<Lock className="h-4 w-4" />}
              required
              error={errors.password?.message}
              hint="Min 8 characters"
            >
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={!!errors.password}
              />
            </FormField>

            <FormField
              label="Confirm Password"
              htmlFor="confirmPassword"
              icon={<Lock className="h-4 w-4" />}
              required
              error={errors.confirmPassword?.message}
            >
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
              />
            </FormField>

            <FormField
              label="Phone Number (Optional)"
              htmlFor="phoneNumber"
              icon={<Phone className="h-4 w-4" />}
              error={errors.phoneNumber?.message}
            >
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                {...register('phoneNumber')}
                error={!!errors.phoneNumber}
              />
            </FormField>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-md mx-auto py-20">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
