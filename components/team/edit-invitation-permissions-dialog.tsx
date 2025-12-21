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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getAvailablePermissions, type Permission } from '@/lib/api/custom-permissions';
import {
    getAllRoles,
    getRoleHierarchy,
    updateInvitationPermissions,
    type Invitation,
    type Role,
    type RoleHierarchy,
} from '@/lib/api/team-management';
import {
    AlertCircle,
    Calendar,
    Car,
    CreditCard,
    Edit,
    FileText,
    FolderTree,
    Loader2,
    Package,
    Percent,
    Shield,
    Tag,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface EditInvitationPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: Invitation | null;
  onSuccess?: () => void;
}

export function EditInvitationPermissionsDialog({
  open,
  onOpenChange,
  invitation,
  onSuccess,
}: EditInvitationPermissionsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<RoleHierarchy[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, Permission[]>>({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // Form state
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [overrideRolePermissions, setOverrideRolePermissions] = useState(false);
  const [notes, setNotes] = useState('');

  const { success, error } = useToast();

  // Initialize form state from invitation
  useEffect(() => {
    if (invitation) {
      setSelectedRole(invitation.role);
      setCustomPermissions(invitation.customPermissions || []);
      setOverrideRolePermissions(invitation.overrideRolePermissions || false);
      setNotes('');
    }
  }, [invitation]);

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

  const handleSubmit = async () => {
    if (!invitation) return;

    setIsSubmitting(true);
    
    const result = await updateInvitationPermissions(invitation.invitationId, {
      role: selectedRole !== invitation.role ? selectedRole : undefined,
      customPermissions: customPermissions.length > 0 ? customPermissions : [],
      overrideRolePermissions,
      notes: notes || undefined,
    });

    if (result.success) {
      success('Invitation updated', 'The invitation permissions have been updated');
      onOpenChange(false);
      onSuccess?.();
    } else {
      error('Failed to update invitation', result.error || 'An error occurred while updating the invitation');
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
    if (customPermissions.includes(permissionCode)) {
      setCustomPermissions(customPermissions.filter(p => p !== permissionCode));
    } else {
      setCustomPermissions([...customPermissions, permissionCode]);
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

  if (!invitation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Invitation Permissions
          </DialogTitle>
          <DialogDescription>
            Update the role and permissions for <strong>{invitation.email}</strong> before they accept.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invitee Info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">{invitation.firstName} {invitation.lastName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2 font-medium">{invitation.email}</span>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            {isLoadingRoles ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading roles...
              </div>
            ) : (
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a role</option>
                {flatRoles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.displayName} (Level {role.hierarchyLevel})
                  </option>
                ))}
              </select>
            )}
          </div>

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

          {/* Override Role Permissions */}
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
              checked={overrideRolePermissions}
              onCheckedChange={setOverrideRolePermissions}
            />
          </div>

          {/* Custom Permissions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Custom Permissions</Label>
              {customPermissions.length > 0 && (
                <Badge variant="default" className="text-xs">
                  {customPermissions.length} selected
                </Badge>
              )}
            </div>

            {isLoadingPermissions ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading permissions...
              </div>
            ) : (
              <Accordion type="multiple" className="w-full border rounded-lg">
                {Object.entries(availablePermissions)
                  .filter(([category]) => category !== 'Merchant Roles')
                  .map(([category, permissions]) => (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="hover:no-underline px-3 py-2">
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
                      <AccordionContent className="px-3">
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
                                  id={`edit-${permission.code}`}
                                  checked={isSelected}
                                  onCheckedChange={() => togglePermission(permission.code)}
                                  disabled={isInRole && !overrideRolePermissions}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`edit-${permission.code}`}
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
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this change..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingRoles || !selectedRole}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Update Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
