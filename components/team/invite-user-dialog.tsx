'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getRoleHierarchy, inviteUser, type RoleHierarchy } from '@/lib/api/team-management';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, User, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.string().min(1, 'Role is required'),
  notes: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<RoleHierarchy[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const { success, error } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  // Fetch available roles
  useEffect(() => {
    if (open) {
      loadRoles();
    }
  }, [open]);

  const loadRoles = async () => {
    setIsLoadingRoles(true);
    const result = await getRoleHierarchy();
    if (result.success && result.data) {
      setRoles(result.data);
    } else {
      error('Failed to load roles', result.error || 'Could not fetch available roles');
    }
    setIsLoadingRoles(false);
  };

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    
    const result = await inviteUser({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      notes: data.notes,
    });

    if (result.success) {
      success('Invitation sent', `Invitation sent to ${data.email}`);
      reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      error('Failed to send invitation', result.error || 'An error occurred while sending the invitation');
    }
    
    setIsSubmitting(false);
  };

  // Flatten role hierarchy for dropdown
  const flattenRoles = (roles: RoleHierarchy[]): RoleHierarchy[] => {
    let result: RoleHierarchy[] = [];
    for (const role of roles) {
      result.push(role);
      if (role.children.length > 0) {
        result = result.concat(flattenRoles(role.children));
      }
    }
    return result;
  };

  const flatRoles = flattenRoles(roles);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your account. They will receive an email with a link to accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Email Address"
            htmlFor="email"
            icon={<Mail className="h-4 w-4" />}
            required
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              error={!!errors.email}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First Name"
              htmlFor="firstName"
              icon={<User className="h-4 w-4" />}
              required
              error={errors.firstName?.message}
            >
              <Input
                id="firstName"
                placeholder="John"
                {...register('firstName')}
                error={!!errors.firstName}
              />
            </FormField>

            <FormField
              label="Last Name"
              htmlFor="lastName"
              icon={<User className="h-4 w-4" />}
              required
              error={errors.lastName?.message}
            >
              <Input
                id="lastName"
                placeholder="Doe"
                {...register('lastName')}
                error={!!errors.lastName}
              />
            </FormField>
          </div>

          <FormField
            label="Role"
            htmlFor="role"
            required
            error={errors.role?.message}
            hint="Select the role for this user. You can only assign roles below your level."
          >
            {isLoadingRoles ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading roles...
              </div>
            ) : (
              <select
                id="role"
                {...register('role')}
                className={`flex h-10 w-full rounded-md border ${
                  errors.role
                    ? 'border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-950/20'
                    : 'border-input bg-background'
                } px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 ${
                  errors.role
                    ? 'focus-visible:ring-red-500'
                    : 'focus-visible:ring-ring'
                } focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">Select a role</option>
                {flatRoles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.displayName} (Level {role.hierarchyLevel})
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="Notes (Optional)"
            htmlFor="notes"
            error={errors.notes?.message}
            hint="Add any additional context or responsibilities"
          >
            <Textarea
              id="notes"
              placeholder="e.g., Responsible for vehicle maintenance and fleet operations"
              rows={3}
              {...register('notes')}
              error={!!errors.notes}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingRoles}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
