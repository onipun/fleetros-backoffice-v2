'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { RoleHierarchy } from '@/lib/api/team-management';
import { ChevronRight, Shield } from 'lucide-react';

interface RoleHierarchyViewProps {
  roles: RoleHierarchy[];
  compact?: boolean;
}

function getRoleBadgeColor(hierarchyLevel: number) {
  if (hierarchyLevel >= 100) return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
  if (hierarchyLevel >= 80) return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
  if (hierarchyLevel >= 50) return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
  return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
}

function RoleNode({ role, depth = 0, compact = false }: { role: RoleHierarchy; depth?: number; compact?: boolean }) {
  const indent = depth * (compact ? 20 : 32);

  return (
    <div>
      <Card className="mb-2" style={{ marginLeft: `${indent}px` }}>
        <CardContent className={compact ? 'p-3' : 'p-4'}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h4 className="font-semibold truncate">{role.displayName}</h4>
                <Badge className={getRoleBadgeColor(role.hierarchyLevel)}>
                  Level {role.hierarchyLevel}
                </Badge>
              </div>
              
              {!compact && (
                <>
                  <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {role.permissions.length} permissions
                    </Badge>
                    {role.canInvite && (
                      <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">
                        Can Invite
                      </Badge>
                    )}
                    {role.canManage && (
                      <Badge variant="outline" className="text-xs text-blue-600 dark:text-blue-400">
                        Can Manage
                      </Badge>
                    )}
                  </div>

                  {role.permissions.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        View Permissions
                      </summary>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}
            </div>
            
            {role.children.length > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
            )}
          </div>
        </CardContent>
      </Card>

      {role.children.length > 0 && (
        <div className="space-y-2">
          {role.children.map((child) => (
            <RoleNode key={child.code} role={child} depth={depth + 1} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RoleHierarchyView({ roles, compact = false }: RoleHierarchyViewProps) {
  if (roles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No roles available to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <RoleNode key={role.code} role={role} depth={0} compact={compact} />
      ))}
    </div>
  );
}
