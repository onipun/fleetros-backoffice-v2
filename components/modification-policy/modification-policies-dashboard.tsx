/**
 * Modification Policies Dashboard Component
 * Lists all modification policies with tier-aware display
 */
'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
    deleteModificationPolicy,
    getAllModificationPolicies,
} from '@/lib/api/modification-policies';
import {
    LOYALTY_TIER_COLORS,
    ModificationPolicy,
} from '@/types/modification-policy';
import { AlertCircle, Edit, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ModificationPoliciesDashboard() {
  const router = useRouter();
  const [policies, setPolicies] = useState<ModificationPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<ModificationPolicy | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const allPolicies = await getAllModificationPolicies();
      setPolicies(allPolicies);
    } catch (error) {
      console.error('Failed to load modification policies:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load policies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!policyToDelete) return;

    try {
      setDeleting(true);
      await deleteModificationPolicy(policyToDelete.id);
      toast({
        title: 'Success',
        description: 'Modification policy deleted successfully',
      });
      setDeleteDialogOpen(false);
      setPolicyToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete policy:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete policy',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (policy: ModificationPolicy) => {
    setPolicyToDelete(policy);
    setDeleteDialogOpen(true);
  };

  const getTierBadge = (tier: ModificationPolicy['loyaltyTier']) => {
    if (!tier) {
      return <Badge variant="outline">Default (All)</Badge>;
    }
    const colorClass = LOYALTY_TIER_COLORS[tier];
    return (
      <Badge className={`${colorClass} text-white`}>
        {tier}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modification Policies</h1>
          <p className="text-muted-foreground">
            Manage booking modification policies and loyalty tier benefits
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/modification-policies/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Link>
        </Button>
      </div>

      {/* Policies List */
      <Card>
        <CardHeader>
          <CardTitle>All Policies</CardTitle>
          <CardDescription>
            View and manage all modification policies including tier-specific configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No policies found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get started by creating your first modification policy
              </p>
              <Button className="mt-4" asChild>
                <Link href="/settings/modification-policies/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Policy
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Free Window</TableHead>
                    <TableHead>Late Fee</TableHead>
                    <TableHead>Category Fee</TableHead>
                    <TableHead>Location Fee</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        {policy.policyName}
                      </TableCell>
                      <TableCell>{getTierBadge(policy.loyaltyTier)}</TableCell>
                      <TableCell>{policy.freeModificationHours}h</TableCell>
                      <TableCell>${policy.lateModificationFee.toFixed(2)}</TableCell>
                      <TableCell>${policy.categoryChangeFee.toFixed(2)}</TableCell>
                      <TableCell>${policy.locationChangeFee.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/settings/modification-policies/${policy.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(policy)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Modification Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{policyToDelete?.policyName}"? This action will soft-delete
              the policy (set active=false) but keep it in the database for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
