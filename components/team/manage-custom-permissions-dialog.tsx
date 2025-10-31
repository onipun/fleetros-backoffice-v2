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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    addCustomPermissions,
    getAllUserPermissions,
    getAvailablePermissions,
    removeCustomPermission,
    type AllPermissionsResponse,
    type Permission,
} from '@/lib/api/custom-permissions';
import { AlertCircle, Loader2, Plus, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ManageCustomPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userName: string;
  userRole: string;
  onPermissionsUpdated?: () => void;
}

export function ManageCustomPermissionsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userRole,
  onPermissionsUpdated,
}: ManageCustomPermissionsDialogProps) {
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, Permission[]>>({});
  const [userPermissions, setUserPermissions] = useState<AllPermissionsResponse | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, userId]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadAvailablePermissions(), loadUserPermissions()]);
    setIsLoading(false);
  };

  const loadAvailablePermissions = async () => {
    const result = await getAvailablePermissions();
    if (result.success && result.data) {
      setAvailablePermissions(result.data.byCategory);
    }
  };

  const loadUserPermissions = async () => {
    const result = await getAllUserPermissions(userId);
    if (result.success && result.data) {
      setUserPermissions(result.data);
    }
  };

  const handleAddPermissions = async () => {
    if (selectedPermissions.length === 0) {
      error('No permissions selected', 'Please select at least one permission to add');
      return;
    }

    setIsSubmitting(true);

    const result = await addCustomPermissions(userId, {
      permissions: selectedPermissions,
      notes: notes || undefined,
      replaceExisting: false,
    });

    if (result.success) {
      success('Permissions added', `Successfully added ${selectedPermissions.length} custom permission(s)`);
      setSelectedPermissions([]);
      setNotes('');
      await loadUserPermissions();
      onPermissionsUpdated?.();
    } else {
      error('Failed to add permissions', result.error || 'An error occurred');
    }

    setIsSubmitting(false);
  };

  const handleRemovePermission = async (permission: string) => {
    const result = await removeCustomPermission(userId, permission);

    if (result.success) {
      success('Permission removed', `Successfully removed ${permission}`);
      await loadUserPermissions();
      onPermissionsUpdated?.();
    } else {
      error('Failed to remove permission', result.error || 'An error occurred');
    }
  };

  const togglePermission = (permissionCode: string) => {
    if (selectedPermissions.includes(permissionCode)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permissionCode));
    } else {
      setSelectedPermissions([...selectedPermissions, permissionCode]);
    }
  };

  const isPermissionDisabled = (permissionCode: string): boolean => {
    // Disable if already in role permissions or custom permissions
    return (
      userPermissions?.roleBasedPermissions.includes(permissionCode) ||
      userPermissions?.customPermissions.includes(permissionCode) ||
      false
    );
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Custom Permissions
          </DialogTitle>
          <DialogDescription>
            Add extra permissions for <strong>{userName}</strong> (Role: {userRole})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Permissions Summary */}
          {userPermissions && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role Permissions (Default from {userRole})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userPermissions.roleBasedPermissions.map(perm => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>

              {userPermissions.hasCustomPermissions && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Custom Permissions ({userPermissions.customPermissions.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {userPermissions.customPermissions.map(perm => (
                      <Badge
                        key={perm}
                        variant="secondary"
                        className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      >
                        {perm}
                        <button
                          onClick={() => handleRemovePermission(perm)}
                          className="ml-2 hover:text-destructive"
                          title="Remove permission"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add New Permissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Add Extra Permissions</h4>
              {selectedPermissions.length > 0 && (
                <Badge variant="secondary">{selectedPermissions.length} selected</Badge>
              )}
            </div>

            <div className="bg-blue-500/5 border-blue-500/20 border rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Custom permissions are added <strong>on top</strong> of role permissions. They provide temporary
                  or special access without changing the user's role.
                </p>
              </div>
            </div>

            <Accordion type="multiple" className="w-full">
              {Object.entries(availablePermissions).map(([category, perms]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {perms.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {perms.map(perm => {
                        const disabled = isPermissionDisabled(perm.code);
                        return (
                          <div
                            key={perm.code}
                            className={`flex items-start gap-3 p-2 rounded hover:bg-accent ${
                              disabled ? 'opacity-50' : ''
                            }`}
                          >
                            <Checkbox
                              id={perm.code}
                              checked={selectedPermissions.includes(perm.code)}
                              onCheckedChange={() => togglePermission(perm.code)}
                              disabled={disabled}
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={perm.code}
                                className={`text-sm font-medium cursor-pointer ${
                                  disabled ? 'cursor-not-allowed' : ''
                                }`}
                              >
                                {perm.displayName}
                                {disabled && (
                                  <span className="ml-2 text-xs text-muted-foreground">(Already has this)</span>
                                )}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">{perm.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Notes */}
          {selectedPermissions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Temporary access during manager vacation"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPermissions}
            disabled={selectedPermissions.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add {selectedPermissions.length > 0 && `(${selectedPermissions.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
