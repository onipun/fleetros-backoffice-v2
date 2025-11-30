/**
 * Loyalty Configuration Dashboard Component
 * Lists all loyalty tier configurations
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
    deleteLoyaltyConfiguration,
    getAllLoyaltyConfigurations,
} from '@/lib/api/loyalty';
import {
    LOYALTY_TIER_COLORS,
    LoyaltyConfiguration,
} from '@/types/modification-policy';
import { AlertCircle, Check, Edit, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function LoyaltyConfigurationDashboard() {
  const router = useRouter();
  const [configurations, setConfigurations] = useState<LoyaltyConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<LoyaltyConfiguration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const loadedRef = useRef(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const configs = await getAllLoyaltyConfigurations();
      setConfigurations(configs);
    } catch (error) {
      console.error('Failed to load loyalty configurations:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
  }, []);

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      setDeleting(true);
      await deleteLoyaltyConfiguration(configToDelete.id);
      toast({
        title: 'Success',
        description: 'Loyalty configuration deleted successfully',
      });
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete configuration',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (config: LoyaltyConfiguration) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  };

  const getTierBadge = (tier: LoyaltyConfiguration['tier']) => {
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
        <p className="text-muted-foreground">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loyalty Program</h1>
          <p className="text-muted-foreground">
            Manage loyalty tier configurations and customer rewards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/loyalty/customers">
              View Customers
            </Link>
          </Button>
          <Button asChild>
            <Link href="/settings/loyalty/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Tier
            </Link>
          </Button>
        </div>
      </div>

      {/* Tiers Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {configurations.map((config) => {
          const colorClass = LOYALTY_TIER_COLORS[config.tier];
          return (
            <Card key={config.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={`${colorClass} text-white`}>
                    {config.tier}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {config.minimumRentalsPerYear}
                    {config.maximumRentalsPerYear ? `-${config.maximumRentalsPerYear}` : '+'}  rentals/year
                  </span>
                </div>
                <CardTitle className="mt-2">{config.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points:</span>
                  <span className="font-medium">{config.pointsPerCurrencyUnit}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">{config.tierDiscountPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Free Upgrade:</span>
                  <span>{config.freeUpgrade ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tier Configurations</CardTitle>
          <CardDescription>
            View and manage detailed settings for each loyalty tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configurations.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tiers configured</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get started by creating your first loyalty tier
              </p>
              <Button className="mt-4" asChild>
                <Link href="/settings/loyalty/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tier
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Rentals/Year</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>{getTierBadge(config.tier)}</TableCell>
                      <TableCell className="font-medium">{config.displayName}</TableCell>
                      <TableCell>
                        {config.minimumRentalsPerYear}
                        {config.maximumRentalsPerYear ? `-${config.maximumRentalsPerYear}` : '+'}
                      </TableCell>
                      <TableCell>{config.pointsPerCurrencyUnit}x</TableCell>
                      <TableCell>{config.bookingCompletionBonus}</TableCell>
                      <TableCell>{config.tierDiscountPercentage}%</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {config.priorityCheckIn && (
                            <Badge variant="outline" className="text-xs">Priority</Badge>
                          )}
                          {config.freeUpgrade && (
                            <Badge variant="outline" className="text-xs">Upgrade</Badge>
                          )}
                          {config.guaranteedAvailability && (
                            <Badge variant="outline" className="text-xs">Guaranteed</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/settings/loyalty/${config.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(config)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loyalty Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{configToDelete?.displayName}" tier? This action will soft-delete
              the configuration (set active=false) but keep it in the database for audit purposes.
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
