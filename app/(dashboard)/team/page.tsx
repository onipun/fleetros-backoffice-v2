'use client';

import { EditInvitationPermissionsDialog } from '@/components/team/edit-invitation-permissions-dialog';
import { InviteUserDialog } from '@/components/team/invite-user-dialog';
import { ManageCustomPermissionsDialog } from '@/components/team/manage-custom-permissions-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    cancelInvitation,
    getAllRoles,
    getInvitations,
    getMyRole,
    getTeamMembers,
    removeUser,
    resendInvitation,
    type Invitation,
    type Role,
    type TeamMember,
    type UserRole,
} from '@/lib/api/team-management';
import { formatDistanceToNow } from 'date-fns';
import {
    Calendar,
    Car,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    FolderTree,
    Loader2,
    Mail,
    MoreVertical,
    Package,
    Percent,
    RefreshCw,
    Shield,
    Tag,
    Trash2,
    UserPlus,
    Users,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [myRole, setMyRole] = useState<UserRole | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [authorities, setAuthorities] = useState<string[]>([]);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [customPermissionsDialogOpen, setCustomPermissionsDialogOpen] = useState(false);
  const [selectedMemberForPermissions, setSelectedMemberForPermissions] = useState<TeamMember | null>(null);
  const [editInvitationDialogOpen, setEditInvitationDialogOpen] = useState(false);
  const [selectedInvitationForEdit, setSelectedInvitationForEdit] = useState<Invitation | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadTeamMembers(),
      loadMyRole(),
      loadAuthorities(),
      loadInvitations(),
      loadAllRoles(),
    ]);
    setIsLoading(false);
  };

  const loadAuthorities = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setAuthorities(data.authorities || []);
        setCurrentUsername(data.username || '');
      }
    } catch (err) {
      console.error('Failed to load authorities:', err);
    }
  };

  const loadTeamMembers = async () => {
    const result = await getTeamMembers();
    if (result.success && result.data) {
      setTeamMembers(result.data);
    }
  };

  const loadMyRole = async () => {
    const result = await getMyRole();
    if (result.success && result.data) {
      setMyRole(result.data);
    }
  };

  const loadAllRoles = async () => {
    const result = await getAllRoles();
    if (result.success && result.data) {
      setAllRoles(result.data);
    }
  };

  const loadInvitations = async () => {
    const result = await getInvitations();
    if (result.success && result.data) {
      setInvitations(result.data);
    }
  };

  const handleResendInvitation = async (invitationId: number) => {
    const result = await resendInvitation(invitationId);
    if (result.success) {
      success('Invitation resent', 'The invitation email has been sent again');
      loadInvitations();
    } else {
      error('Failed to resend invitation', result.error || 'An error occurred');
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    const result = await cancelInvitation(invitationId);
    if (result.success) {
      success('Invitation cancelled', 'The invitation has been cancelled');
      loadInvitations();
    } else {
      error('Failed to cancel invitation', result.error || 'An error occurred');
    }
  };

  const handleRemoveUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from your team?`)) {
      return;
    }

    const result = await removeUser(userId);
    if (result.success) {
      success('User removed', `${username} has been removed from your team`);
      loadTeamMembers();
    } else {
      error('Failed to remove user', result.error || 'An error occurred');
    }
  };

  // Check permissions from both myRole.permissions and JWT authorities
  const canInvite = 
    myRole?.permissions?.includes('USER_INVITE') || 
    authorities.includes('ROLE_USER_INVITE');
  
  const canManageUsers = 
    myRole?.permissions?.includes('USER_WRITE') || 
    authorities.includes('ROLE_USER_WRITE');

  const getRoleBadgeColor = (hierarchyLevel: number) => {
    if (hierarchyLevel >= 100) return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
    if (hierarchyLevel >= 80) return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    if (hierarchyLevel >= 50) return 'bg-green-500/10 text-green-700 dark:text-green-400';
    return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  };

  const categorizePermissions = (permissions: string[]) => {
    const categories: Record<string, string[]> = {
      'Role Management': [],
      'Vehicle Management': [],
      'Booking Management': [],
      'User Management': [],
      'Pricing Management': [],
      'Payment Management': [],
      'Report Management': [],
      'Offering Management': [],
      'Package Management': [],
      'Discount Management': [],
      'Other': [],
    };

    permissions.forEach((permission) => {
      if (permission.includes('MERCHANT_ADMIN') || permission.includes('MERCHANT_MANAGER') || 
          permission.includes('MERCHANT_STAFF') || permission.includes('MERCHANT_VIEWER')) {
        categories['Role Management'].push(permission);
      } else if (permission.includes('CAR_') || permission.includes('VEHICLE_')) {
        categories['Vehicle Management'].push(permission);
      } else if (permission.includes('BOOKING_')) {
        categories['Booking Management'].push(permission);
      } else if (permission.includes('USER_')) {
        categories['User Management'].push(permission);
      } else if (permission.includes('PRICING_')) {
        categories['Pricing Management'].push(permission);
      } else if (permission.includes('PAYMENT_')) {
        categories['Payment Management'].push(permission);
      } else if (permission.includes('REPORT_')) {
        categories['Report Management'].push(permission);
      } else if (permission.includes('OFFERING_')) {
        categories['Offering Management'].push(permission);
      } else if (permission.includes('PACKAGE_')) {
        categories['Package Management'].push(permission);
      } else if (permission.includes('DISCOUNT_')) {
        categories['Discount Management'].push(permission);
      } else {
        categories['Other'].push(permission);
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach((key) => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Role Management':
        return <Shield className="h-3.5 w-3.5" />;
      case 'Vehicle Management':
        return <Car className="h-3.5 w-3.5" />;
      case 'Booking Management':
        return <Calendar className="h-3.5 w-3.5" />;
      case 'User Management':
        return <Users className="h-3.5 w-3.5" />;
      case 'Pricing Management':
        return <Tag className="h-3.5 w-3.5" />;
      case 'Payment Management':
        return <CreditCard className="h-3.5 w-3.5" />;
      case 'Report Management':
        return <FileText className="h-3.5 w-3.5" />;
      case 'Offering Management':
        return <FolderTree className="h-3.5 w-3.5" />;
      case 'Package Management':
        return <Package className="h-3.5 w-3.5" />;
      case 'Discount Management':
        return <Percent className="h-3.5 w-3.5" />;
      default:
        return <FolderTree className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (status: Invitation['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-700 dark:text-gray-400">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING');
  const otherInvitations = invitations.filter(inv => inv.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage team members and invitations
          </p>
        </div>
        <Button 
          onClick={() => setInviteDialogOpen(true)}
          disabled={!canInvite}
          title={!canInvite ? 'You do not have permission to invite users' : ''}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
      </div>

      {/* My Role Card */}
      {myRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{myRole.roleDisplayName}</h3>
                  <p className="text-sm text-muted-foreground">{myRole.roleDescription}</p>
                </div>
                <Badge className={getRoleBadgeColor(myRole.hierarchyLevel || 0)}>
                  Level {myRole.hierarchyLevel}
                </Badge>
              </div>
              {myRole.permissions && myRole.permissions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {myRole.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({teamMembers.length})
              </CardTitle>
              <CardDescription>
                Active members in your account
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadTeamMembers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => {
                const isCurrentUser = member.username.toLowerCase() === currentUsername.toLowerCase();
                
                return (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {member.firstName} {member.lastName}
                          {isCurrentUser && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              you
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                        <div className="text-xs text-muted-foreground">@{member.username}</div>
                      </div>
                    </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.roleDisplayName}</div>
                      <div className="text-xs text-muted-foreground">{member.roleDescription}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(member.assignedAt), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.active ? 'default' : 'secondary'}>
                      {member.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {canManageUsers && (
                    <TableCell className="text-right">
                      {!isCurrentUser ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelectedMemberForPermissions(member);
                                setCustomPermissionsDialogOpen(true);
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveUser(member.userId, member.username)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Invitations ({pendingInvitations.length})
                </CardTitle>
                <CardDescription>
                  Invitations waiting to be accepted
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadInvitations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role & Permissions</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.invitationId}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {invitation.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invitation.firstName} {invitation.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">{invitation.roleDisplayName || invitation.role}</Badge>
                        {invitation.customPermissions && invitation.customPermissions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {invitation.customPermissions.slice(0, 3).map((perm) => (
                              <Badge 
                                key={perm} 
                                variant="secondary" 
                                className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400"
                              >
                                +{perm}
                              </Badge>
                            ))}
                            {invitation.customPermissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{invitation.customPermissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        {invitation.overrideRolePermissions && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            Role Override
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedInvitationForEdit(invitation);
                              setEditInvitationDialogOpen(true);
                            }}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Edit Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResendInvitation(invitation.invitationId)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Resend Invitation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleCancelInvitation(invitation.invitationId)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Invitation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invitation History */}
      {otherInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitation History</CardTitle>
            <CardDescription>Past invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherInvitations.map((invitation) => (
                  <TableRow key={invitation.invitationId}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={loadData}
      />

      {/* Custom Permissions Dialog */}
      {selectedMemberForPermissions && (
        <ManageCustomPermissionsDialog
          open={customPermissionsDialogOpen}
          onOpenChange={setCustomPermissionsDialogOpen}
          userId={selectedMemberForPermissions.userId}
          userName={`${selectedMemberForPermissions.firstName} ${selectedMemberForPermissions.lastName}`}
          userRole={selectedMemberForPermissions.roleDisplayName}
          onPermissionsUpdated={loadTeamMembers}
        />
      )}

      {/* Edit Invitation Permissions Dialog */}
      <EditInvitationPermissionsDialog
        open={editInvitationDialogOpen}
        onOpenChange={setEditInvitationDialogOpen}
        invitation={selectedInvitationForEdit}
        onSuccess={loadInvitations}
      />
    </div>
  );
}
