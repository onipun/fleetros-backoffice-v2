'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getAvailablePermissions, type Permission } from '@/lib/api/custom-permissions';
import { getAllRoles, getRoleHierarchy, inviteUser, type Role, type RoleHierarchy } from '@/lib/api/team-management';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    AlertCircle,
    Calendar,
    Car,
    ChevronDown,
    ChevronUp,
    CreditCard,
    FileText,
    FolderTree,
    Loader2,
    Mail,
    Package,
    Percent,
    Shield,
    Tag,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.string().min(1, 'Role is required'),
  notes: z.string().optional(),
  customPermissions: z.array(z.string()).optional(),
  overrideRolePermissions: z.boolean().optional(),
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
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, Permission[]>>({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [showPermissions, setShowPermissions] = useState(false);
  const { success, error } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      customPermissions: [],
      overrideRolePermissions: false,
    },
  });

  const selectedRole = watch('role');
  const customPermissions = watch('customPermissions') || [];
  const overrideRolePermissions = watch('overrideRolePermissions') || false;

  // Get role default permissions
  const getRolePermissions = (roleCode: string): string[] => {
    const role = allRoles.find(r => r.code === roleCode);
    return role?.permissions || [];
  };

  // Calculate effective permissions
  const getEffectivePermissions = (): string[] => {
    if (!selectedRole) return [];
    
    const rolePermissions = getRolePermissions(selectedRole);
    
    if (overrideRolePermissions) {
      return customPermissions;
    }
    
    // Merge role permissions with custom permissions (unique)
    const merged = new Set([...rolePermissions, ...customPermissions]);
    return Array.from(merged);
  };

  const effectivePermissions = getEffectivePermissions();

  // Fetch available roles and permissions
  useEffect(() => {
    if (open) {
      loadRoles();
      loadPermissions();
    }
  }, [open]);

  const loadRoles = async () => {
    setIsLoadingRoles(true);
    const [hierarchyResult, allRolesResult] = await Promise.all([
      getRoleHierarchy(),
      getAllRoles(),
    ]);
    
    if (hierarchyResult.success && hierarchyResult.data) {
      setRoles(hierarchyResult.data);
    } else {
      error('Failed to load roles', hierarchyResult.error || 'Could not fetch available roles');
    }
    
    if (allRolesResult.success && allRolesResult.data) {
      setAllRoles(allRolesResult.data);
    }
    
    setIsLoadingRoles(false);
  };

  const loadPermissions = async () => {
    setIsLoadingPermissions(true);
    const result = await getAvailablePermissions();
    if (result.success && result.data) {
      setAvailablePermissions(result.data.byCategory);
    }
    setIsLoadingPermissions(false);
  };

  const onSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    
    const result = await inviteUser({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      notes: data.notes,
      customPermissions: data.customPermissions && data.customPermissions.length > 0 ? data.customPermissions : undefined,
      overrideRolePermissions: data.overrideRolePermissions || undefined,
    });

    if (result.success) {
      success('Invitation sent', `Invitation sent to ${data.email}`);
      reset();
      setShowPermissions(false);
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

  const togglePermission = (permissionCode: string) => {
    const current = customPermissions || [];
    if (current.includes(permissionCode)) {
      setValue('customPermissions', current.filter(p => p !== permissionCode));
    } else {
      setValue('customPermissions', [...current, permissionCode]);
    }
  };

  const isPermissionInRole = (permissionCode: string): boolean => {
    if (!selectedRole) return false;
    return getRolePermissions(selectedRole).includes(permissionCode);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'User Management':
        return <Users className="h-4 w-4" />;
      case 'Vehicle Management':
        return <Car className="h-4 w-4" />;
      case 'Booking Management':
        return <Calendar className="h-4 w-4" />;
      case 'Pricing Management':
        return <Tag className="h-4 w-4" />;
      case 'Payment Management':
        return <CreditCard className="h-4 w-4" />;
      case 'Reports':
        return <FileText className="h-4 w-4" />;
      case 'Merchant Roles':
        return <Shield className="h-4 w-4" />;
      case 'Offering Management':
        return <FolderTree className="h-4 w-4" />;
      case 'Package Management':
        return <Package className="h-4 w-4" />;
      case 'Discount Management':
        return <Percent className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const handleClose = () => {
    reset();
    setShowPermissions(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your account. Customize their role and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info */}
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

          {/* Role Selection */}
          <FormField
            label="Role"
            htmlFor="role"
            required
            error={errors.role?.message}
            hint="Select the base role. You can add custom permissions below."
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

          {/* Role Permissions Info */}
          {selectedRole && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role Default Permissions
                </h4>
                <Badge variant="outline" className="text-xs">
                  {getRolePermissions(selectedRole).length} permissions
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {getRolePermissions(selectedRole).slice(0, 8).map((perm) => (
                  <Badge key={perm} variant="secondary" className="text-xs">
                    {perm}
                  </Badge>
                ))}
                {getRolePermissions(selectedRole).length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{getRolePermissions(selectedRole).length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Custom Permissions Toggle */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowPermissions(!showPermissions)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Custom Permissions</span>
                {customPermissions.length > 0 && (
                  <Badge variant="default" className="text-xs">
                    {customPermissions.length} selected
                  </Badge>
                )}
              </div>
              {showPermissions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showPermissions && (
              <div className="p-4 pt-0 space-y-4 border-t">
                {/* Override Role Permissions */}
                <Controller
                  name="overrideRolePermissions"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <div>
                          <Label htmlFor="overrideRolePermissions" className="text-sm font-medium">
                            Override Role Permissions
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            If enabled, ONLY custom permissions will be used (role defaults ignored)
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="overrideRolePermissions"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />

                {/* Permission Categories */}
                {isLoadingPermissions ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading permissions...
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(availablePermissions)
                      .filter(([category]) => category !== 'Merchant Roles') // Hide role permissions
                      .map(([category, permissions]) => (
                        <AccordionItem key={category} value={category}>
                          <AccordionTrigger className="hover:no-underline py-2">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(category)}
                              <span className="text-sm">{category}</span>
                              <Badge variant="outline" className="text-xs ml-2">
                                {permissions.length}
                              </Badge>
                              {permissions.some(p => customPermissions.includes(p.code)) && (
                                <Badge variant="default" className="text-xs">
                                  {permissions.filter(p => customPermissions.includes(p.code)).length} selected
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {permissions.map((permission) => {
                                const isInRole = isPermissionInRole(permission.code);
                                const isSelected = customPermissions.includes(permission.code);
                                
                                return (
                                  <div
                                    key={permission.code}
                                    className={`flex items-start gap-3 p-2 rounded-lg border transition-colors ${
                                      isSelected
                                        ? 'bg-primary/5 border-primary/20'
                                        : isInRole
                                        ? 'bg-muted/30 border-muted'
                                        : 'hover:bg-muted/50'
                                    }`}
                                  >
                                    <Checkbox
                                      id={permission.code}
                                      checked={isSelected}
                                      onCheckedChange={() => togglePermission(permission.code)}
                                      disabled={isInRole && !overrideRolePermissions}
                                    />
                                    <div className="flex-1">
                                      <Label
                                        htmlFor={permission.code}
                                        className={`text-sm font-medium cursor-pointer ${
                                          isInRole && !overrideRolePermissions
                                            ? 'text-muted-foreground'
                                            : ''
                                        }`}
                                      >
                                        {permission.displayName}
                                        {isInRole && (
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            In Role
                                          </Badge>
                                        )}
                                      </Label>
                                      <p className="text-xs text-muted-foreground">
                                        {permission.description}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                )}
              </div>
            )}
          </div>

          {/* Effective Permissions Preview */}
          {(selectedRole || customPermissions.length > 0) && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                <Shield className="h-4 w-4" />
                Effective Permissions ({effectivePermissions.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {effectivePermissions.slice(0, 12).map((perm) => (
                  <Badge 
                    key={perm} 
                    variant="secondary" 
                    className={`text-xs ${
                      customPermissions.includes(perm) && !getRolePermissions(selectedRole).includes(perm)
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        : ''
                    }`}
                  >
                    {perm}
                    {customPermissions.includes(perm) && !getRolePermissions(selectedRole).includes(perm) && (
                      <span className="ml-1 text-blue-500">+</span>
                    )}
                  </Badge>
                ))}
                {effectivePermissions.length > 12 && (
                  <Badge variant="outline" className="text-xs">
                    +{effectivePermissions.length - 12} more
                  </Badge>
                )}
              </div>
              {overrideRolePermissions && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Role defaults overridden - only custom permissions will apply
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <FormField
            label="Notes (Optional)"
            htmlFor="notes"
            error={errors.notes?.message}
            hint="Add any additional context or responsibilities"
          >
            <Textarea
              id="notes"
              placeholder="e.g., Responsible for vehicle maintenance and fleet operations"
              rows={2}
              {...register('notes')}
              error={!!errors.notes}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
