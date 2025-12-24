'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { preventEnterSubmission } from '@/lib/form-utils';
import type { PricingFormData } from '@/lib/validations/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type PricingEntityType = 'vehicle' | 'package' | 'booking';

type PricingFormState = PricingFormData & {
  entityType: PricingEntityType;
  entityId: number;
};

const extractEntityId = (link?: string) => {
  if (!link) return undefined;
  const segments = link.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const parsedId = Number.parseInt(lastSegment ?? '', 10);
  return Number.isNaN(parsedId) ? undefined : parsedId;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export default function EditPricingPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pricingId = params.id as string;

  const [formData, setFormData] = useState<PricingFormState>({
    entityType: 'vehicle',
    entityId: 0,
    baseRate: 0,
    rateType: 'DAILY',
    depositAmount: 0,
    minimumRentalDays: 1,
    validFrom: '',
    validTo: '',
    neverExpires: false,
    isDefault: false,
  });

  const [entityName, setEntityName] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch pricing details using v1 API
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing', pricingId],
    queryFn: async () => {
      // Use v1 API endpoint which returns vehicleId directly
      const token = await fetch('/api/auth/session').then(r => r.json()).then(s => s.accessToken);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/pricings/${pricingId}`, {
        headers,
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }
      
      const pricingData = await response.json();
      return pricingData;
    },
  });

  // Populate form when pricing data is loaded
  useEffect(() => {
    if (pricing) {
      console.log('Pricing data loaded:', pricing);
      
      let entityType: 'vehicle' | 'package' | 'booking' = 'vehicle';
      let entityId = 0;

      // Extract IDs directly from v1 API response fields
      if (pricing.vehicleId) {
        entityType = 'vehicle';
        entityId = pricing.vehicleId;
      } else if (pricing.packageId) {
        entityType = 'package';
        entityId = pricing.packageId;
      } else if (pricing.bookingId) {
        entityType = 'booking';
        entityId = pricing.bookingId;
      }

      console.log('Final entity:', { entityType, entityId });

      setFormData({
        entityType,
        entityId,
        baseRate: pricing.baseRate,
        rateType: pricing.rateType,
        depositAmount: pricing.depositAmount,
        minimumRentalDays: pricing.minimumRentalDays,
        validFrom: pricing.validFrom?.substring(0, 16) || '',
        validTo: pricing.validTo?.substring(0, 16) || '',
        neverExpires: pricing.neverExpires || false,
        isDefault: pricing.isDefault || false,
      });
    }
  }, [pricing]);

  // Fetch entity name when entityId is available
  useEffect(() => {
    const fetchEntityName = async () => {
      if (formData.entityId > 0) {
        try {
          if (formData.entityType === 'vehicle') {
            const vehicle = await hateoasClient.getResource<any>('vehicles', formData.entityId.toString());
            setEntityName(vehicle.name || `Vehicle #${formData.entityId}`);
          } else if (formData.entityType === 'package') {
            const pkg = await hateoasClient.getResource<any>('packages', formData.entityId.toString());
            setEntityName(pkg.name || `Package #${formData.entityId}`);
          } else if (formData.entityType === 'booking') {
            setEntityName(`Booking #${formData.entityId}`);
          }
        } catch (error) {
          console.error('Failed to fetch entity name:', error);
          setEntityName(`${formData.entityType.charAt(0).toUpperCase() + formData.entityType.slice(1)} #${formData.entityId}`);
        }
      }
    };

    fetchEntityName();
  }, [formData.entityId, formData.entityType]);

  const updateMutation = useMutation({
    mutationFn: async (data: PricingFormState) => {
      // Build the request payload - EXCLUDE entity link as per Spring Data REST best practices
      // Entity associations should not be changed in UPDATE operations
      const payload: any = {
        baseRate: data.baseRate,
        rateType: data.rateType,
        depositAmount: data.depositAmount,
        minimumRentalDays: data.minimumRentalDays,
        neverExpires: data.neverExpires,
        isDefault: data.isDefault,
      };

      // Only include validity dates if not neverExpires
      if (!data.neverExpires) {
        payload.validFrom = data.validFrom;
        payload.validTo = data.validTo;
      }

      return hateoasClient.update('pricings', pricingId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing', pricingId] });
      queryClient.invalidateQueries({ queryKey: ['pricings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', formData.entityId, 'pricings'] });
      toast({
        title: t('common.success'),
        description: t('pricing.form.updateSuccess'),
      });
      // Redirect back to the entity (vehicle/package/booking)
      router.push(`/${formData.entityType}s/${formData.entityId}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Use soft delete (deactivate) endpoint
      const token = await fetch('/api/auth/session').then(r => r.json()).then(s => s.accessToken);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/pricings/${pricingId}/deactivate`, {
        method: 'PATCH',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to deactivate pricing');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricings'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', formData.entityId, 'pricings'] });
      queryClient.invalidateQueries({ queryKey: ['package', formData.entityId, 'pricings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', formData.entityId, 'pricings'] });
      toast({
        title: t('common.success'),
        description: t('pricing.form.deleteSuccess'),
      });
      // Redirect back to the entity (vehicle/package/booking)
      router.push(`/${formData.entityType}s/${formData.entityId}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message || t('pricing.form.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.baseRate <= 0) {
      toast({
        title: t('pricing.form.validationErrorTitle'),
        description: t('pricing.form.baseRateRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.depositAmount < 0) {
      toast({
        title: t('pricing.form.validationErrorTitle'),
        description: t('pricing.form.depositNonNegative'),
        variant: 'destructive',
      });
      return;
    }

    // Only validate dates if not neverExpires
    if (!formData.neverExpires) {
      if (!formData.validFrom || !formData.validTo) {
        toast({
          title: t('pricing.form.validationErrorTitle'),
          description: t('pricing.form.validityRequired'),
          variant: 'destructive',
        });
        return;
      }

      if (new Date(formData.validFrom) >= new Date(formData.validTo)) {
        toast({
          title: t('pricing.form.validationErrorTitle'),
          description: t('pricing.form.validityOrder'),
          variant: 'destructive',
        });
        return;
      }
    }

    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (deleteConfirmText.toUpperCase() !== 'DELETE') {
      toast({
        title: t('common.error'),
        description: t('pricing.form.deleteConfirmError'),
        variant: 'destructive',
      });
      return;
    }
    deleteMutation.mutate();
  };

  const openDeleteDialog = () => {
    setDeleteConfirmText('');
    setShowDeleteDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t('pricing.form.loadingPricing')}</p>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-destructive">{t('pricing.form.notFound')}</p>
        <Link href="/vehicles">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
      </div>
    );
  }

  const backUrl = `/${formData.entityType}s/${formData.entityId}`;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={backUrl}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('pricing.editPricing')}</h1>
          <p className="text-muted-foreground">{t('pricing.form.editDescription')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmission}>
        <div className="space-y-6">
          {/* Entity Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.linkedEntity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">{t('pricing.form.connectedTo')}:</span>
                  <Link 
                    href={`/${formData.entityType}s/${formData.entityId}`}
                    className="font-semibold hover:underline text-primary"
                  >
                    {entityName || `${formData.entityType.charAt(0).toUpperCase() + formData.entityType.slice(1)} #${formData.entityId}`}
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('pricing.form.entityCannotChange')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rate Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.rateConfiguration')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rateType">{t('pricing.rateType')} *</Label>
                  <select
                    id="rateType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.rateType}
                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
                    required
                  >
                    <option value="HOURLY">{t('pricing.rateTypes.hourly')}</option>
                    <option value="DAILY">{t('pricing.rateTypes.daily')}</option>
                    <option value="WEEKLY">{t('pricing.rateTypes.weekly')}</option>
                    <option value="MONTHLY">{t('pricing.rateTypes.monthly')}</option>
                    <option value="FLAT">{t('pricing.rateTypes.flat')}</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {t('pricing.form.rateTypeHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumRentalDays">{t('pricing.minimumRentalDays')} *</Label>
                  <Input
                    id="minimumRentalDays"
                    type="number"
                    min="1"
                    value={formData.minimumRentalDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumRentalDays: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('pricing.form.minimumRentalHint')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.pricingDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="baseRate">{t('pricing.baseRate')} *</Label>
                  <CurrencyInput
                    id="baseRate"
                    value={formData.baseRate}
                    onChange={(value) => setFormData({ ...formData, baseRate: value })}
                    currency="MYR"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('pricing.form.baseRateHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">{t('pricing.depositAmount')} *</Label>
                  <CurrencyInput
                    id="depositAmount"
                    value={formData.depositAmount}
                    onChange={(value) => setFormData({ ...formData, depositAmount: value })}
                    currency="MYR"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('pricing.form.depositHint')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validity Period */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.validityPeriod')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Never Expires Checkbox */}
              <div className="rounded-md border border-dashed p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="neverExpires"
                    checked={Boolean(formData.neverExpires)}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, neverExpires: checked === true })
                    }
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="neverExpires" className="text-sm font-medium leading-none">
                      {t('pricing.form.neverExpiresLabel')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('pricing.form.neverExpiresHelper')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Fields - Only show if not neverExpires */}
              {!formData.neverExpires && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">{t('pricing.validFrom')} *</Label>
                    <DateTimePicker
                      id="validFrom"
                      value={formData.validFrom}
                      onChange={(value) => setFormData({ ...formData, validFrom: value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('pricing.form.validFromHint')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validTo">{t('pricing.validTo')} *</Label>
                    <DateTimePicker
                      id="validTo"
                      value={formData.validTo}
                      onChange={(value) => setFormData({ ...formData, validTo: value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('pricing.form.validToHint')}
                    </p>
                  </div>
                </div>
              )}

              {/* Default Pricing Checkbox */}
              <div className="rounded-md border border-dashed p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="isDefault"
                    checked={Boolean(formData.isDefault)}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isDefault: checked === true })
                    }
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="isDefault" className="text-sm font-medium leading-none">
                      {t('pricing.form.defaultLabel')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('pricing.form.defaultHelper')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Button
              type="button"
              variant="destructive"
              onClick={openDeleteDialog}
              disabled={deleteMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('pricing.form.deletePricing')}
            </Button>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Link href={backUrl} className="flex-1 sm:flex-none">
                <Button type="button" variant="outline" className="w-full">
                  {t('common.cancel')}
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="flex-1 sm:flex-none"
              >
                {updateMutation.isPending ? t('pricing.form.updating') : t('pricing.form.updatePricing')}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-xl">{t('pricing.form.deleteDialogTitle')}</DialogTitle>
                <DialogDescription className="mt-1">
                  {t('pricing.form.deleteDialogSubtitle')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted/50 border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">{t('pricing.form.entity')}:</span>
                <span className="font-semibold">{entityName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">{t('pricing.baseRate')}:</span>
                <span className="font-semibold">{formData.baseRate.toFixed(2)} MYR</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted-foreground">{t('pricing.rateType')}:</span>
                <span className="font-semibold">{formData.rateType}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                <p className="text-sm text-destructive font-medium mb-2">
                  ⚠️ {t('pricing.form.deleteWarningTitle')}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>{t('pricing.form.deleteWarning1')}</li>
                  <li>{t('pricing.form.deleteWarning2')}</li>
                  <li>{t('pricing.form.deleteWarning3')}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                  {t('pricing.form.deleteConfirmLabel')}
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="font-mono"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  {t('pricing.form.deleteConfirmHint')}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending || deleteConfirmText.toUpperCase() !== 'DELETE'}
            >
              {deleteMutation.isPending ? (
                <>{t('pricing.form.deleting')}</>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('pricing.form.confirmDelete')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
