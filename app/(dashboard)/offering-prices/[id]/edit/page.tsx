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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { deleteOfferingPrice, updateOfferingPrice } from '@/lib/api/offering-price-api';
import { preventEnterSubmission } from '@/lib/form-utils';
import { OfferingRateType, type Offering, type OfferingPrice } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

interface OfferingPriceFormState {
  offeringId: number;
  baseRate: number;
  rateType: OfferingRateType;
  priority: number;
  active: boolean;
  isDefault: boolean;
  minimumQuantity?: number;
  maximumQuantity?: number;
  neverExpires: boolean;
  validFrom: string;
  validTo: string;
  description: string;
}

export default function EditOfferingPricePage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const priceId = params.id as string;

  const [formData, setFormData] = useState<OfferingPriceFormState>({
    offeringId: 0,
    baseRate: 0,
    rateType: OfferingRateType.DAILY,
    priority: 5,
    active: true,
    isDefault: false,
    minimumQuantity: undefined,
    maximumQuantity: undefined,
    neverExpires: false,
    validFrom: '',
    validTo: '',
    description: '',
  });

  const [offeringName, setOfferingName] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch offering price details
  const { data: offeringPrice, isLoading } = useQuery({
    queryKey: ['offering-price', priceId],
    queryFn: async () => {
      const token = await fetch('/api/auth/session').then((r) => r.json()).then((s) => s.accessToken);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/offering-prices/${priceId}`, {
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch offering price');
      }

      const data: OfferingPrice = await response.json();
      return data;
    },
  });

  // Populate form when offering price data is loaded
  useEffect(() => {
    if (offeringPrice) {
      console.log('Offering price data loaded:', offeringPrice);

      setFormData({
        offeringId: 0, // Will be set after fetching offering via HATEOAS link
        baseRate: offeringPrice.baseRate || 0,
        rateType: offeringPrice.rateType || OfferingRateType.DAILY,
        priority: offeringPrice.priority || 5,
        active: offeringPrice.active ?? true,
        isDefault: offeringPrice.isDefault ?? false,
        minimumQuantity: offeringPrice.minimumQuantity,
        maximumQuantity: offeringPrice.maximumQuantity,
        neverExpires: (offeringPrice as any).neverExpires ?? (!offeringPrice.validFrom && !offeringPrice.validTo),
        validFrom: offeringPrice.validFrom?.substring(0, 16) || '',
        validTo: offeringPrice.validTo?.substring(0, 16) || '',
        description: offeringPrice.description || '',
      });
    }
  }, [offeringPrice]);

  // Fetch offering details by following the HATEOAS link
  useEffect(() => {
    const fetchOfferingFromLink = async () => {
      if (!offeringPrice?._links?.offering) return;
      
      try {
        const offeringLink = Array.isArray(offeringPrice._links.offering) 
          ? offeringPrice._links.offering[0] 
          : offeringPrice._links.offering;
        
        if (!offeringLink?.href) return;

        // Follow the HATEOAS link to get offering details
        const token = await fetch('/api/auth/session').then((r) => r.json()).then((s) => s.accessToken);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(offeringLink.href, {
          headers,
          cache: 'no-store',
        });

        if (response.ok) {
          const offering: Offering = await response.json();
          setOfferingName(offering.name || `Offering #${offering.id}`);
          if (offering.id) {
            setFormData(prev => ({ ...prev, offeringId: offering.id as number }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch offering from HATEOAS link:', error);
      }
    };

    fetchOfferingFromLink();
  }, [offeringPrice]);

  const updateMutation = useMutation({
    mutationFn: async (data: OfferingPriceFormState) => {
      const payload: Partial<OfferingPrice> = {
        baseRate: data.baseRate,
        rateType: data.rateType,
        priority: data.priority,
        active: data.active,
        isDefault: data.isDefault,
        minimumQuantity: data.minimumQuantity,
        maximumQuantity: data.maximumQuantity,
        description: data.description || undefined,
      };

      // Add neverExpires to payload
      (payload as any).neverExpires = data.neverExpires;

      // Only include validity dates if not neverExpires
      if (!data.neverExpires) {
        payload.validFrom = data.validFrom;
        payload.validTo = data.validTo;
      }

      return updateOfferingPrice(parseInt(priceId), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offering-price', priceId] });
      queryClient.invalidateQueries({ queryKey: ['offering-prices', formData.offeringId] });
      queryClient.invalidateQueries({ queryKey: ['offering', formData.offeringId] });
      toast({
        title: t('common.success'),
        description: t('pricing.form.updateSuccess'),
      });
      // Redirect back to the offering
      router.push(`/offerings/${formData.offeringId}`);
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
      return deleteOfferingPrice(parseInt(priceId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offering-prices', formData.offeringId] });
      queryClient.invalidateQueries({ queryKey: ['offering', formData.offeringId] });
      toast({
        title: t('common.success'),
        description: t('pricing.form.deleteSuccess'),
      });
      // Redirect back to the offering
      router.push(`/offerings/${formData.offeringId}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (deleteConfirmText === 'DELETE') {
      deleteMutation.mutate();
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t('pricing.form.loadingPricing')}</p>
      </div>
    );
  }

  const backUrl = formData.offeringId > 0 ? `/offerings/${formData.offeringId}` : '/offerings';

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
          {/* Linked Entity Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.linkedEntity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">{t('pricing.form.connectedTo')}:</span>
                  <Link href={backUrl} className="font-semibold hover:underline text-primary">
                    {offeringName || `Offering #${formData.offeringId}`}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.rateConfiguration')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base Rate */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="baseRate">
                    {t('pricing.baseRate')} {t('common.required')}
                  </Label>
                  <CurrencyInput
                    id="baseRate"
                    value={formData.baseRate}
                    onChange={(value) => setFormData({ ...formData, baseRate: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rateType">
                    {t('pricing.rateType')} {t('common.required')}
                  </Label>
                  <select
                    id="rateType"
                    value={formData.rateType}
                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value as OfferingRateType })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    {Object.values(OfferingRateType).map((type) => (
                      <option key={type} value={type}>
                        {t(`pricing.rateTypes.${type.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">{t('offering.priority')}</Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
                />
                <p className="text-xs text-muted-foreground">1 = highest priority, 10 = lowest priority</p>
              </div>

              {/* Active & Default Checkboxes */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: Boolean(checked) })}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    {t('common.active')}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: Boolean(checked) })}
                  />
                  <Label htmlFor="isDefault" className="cursor-pointer">
                    {t('pricing.form.defaultLabel')}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Limits Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('offering.quantityLimits')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minimumQuantity">{t('offering.minimumQuantity')}</Label>
                  <Input
                    id="minimumQuantity"
                    type="number"
                    min={0}
                    value={formData.minimumQuantity ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumQuantity: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maximumQuantity">{t('offering.maximumQuantity')}</Label>
                  <Input
                    id="maximumQuantity"
                    type="number"
                    min={0}
                    value={formData.maximumQuantity ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maximumQuantity: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validity Period Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.validityPeriod')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Never Expires Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="neverExpires"
                  checked={formData.neverExpires}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      neverExpires: Boolean(checked),
                      validFrom: checked ? '' : formData.validFrom,
                      validTo: checked ? '' : formData.validTo,
                    })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="neverExpires" className="cursor-pointer">
                    {t('pricing.form.neverExpires')}
                  </Label>
                  <p className="text-xs text-muted-foreground">{t('pricing.form.neverExpiresHint')}</p>
                </div>
              </div>

              {/* Valid From/To */}
              {!formData.neverExpires && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">
                      {t('pricing.validFrom')} {t('common.required')}
                    </Label>
                    <DateTimePicker
                      id="validFrom"
                      value={formData.validFrom}
                      onChange={(value) => setFormData({ ...formData, validFrom: value || '' })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validTo">
                      {t('pricing.validTo')} {t('common.required')}
                    </Label>
                    <DateTimePicker
                      id="validTo"
                      value={formData.validTo}
                      onChange={(value) => setFormData({ ...formData, validTo: value || '' })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="E.g., Weekend rate, Bulk discount for 3+ items, etc."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href={backUrl}>
              <Button type="button" variant="outline">
                {t('common.cancel')}
              </Button>
            </Link>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.saving') : t('pricing.form.updatePricing')}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('pricing.form.deleteDialogTitle')}
            </DialogTitle>
            <DialogDescription>{t('pricing.form.deleteDialogSubtitle')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{t('pricing.form.deleteConfirmLabel')}</p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmText !== 'DELETE' || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
