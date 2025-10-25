'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { usePricingTags } from '@/lib/api/hooks';
import type { PricingFormData } from '@/lib/validations/schemas';
import type { Pricing, PricingTag } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
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

export default function EditPricingPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pricingId = params.id as string;

  // Fetch existing tags for autocomplete
  const { data: existingTags = [] } = usePricingTags();

  const [formData, setFormData] = useState<PricingFormState>({
    entityType: 'vehicle',
    entityId: 0,
    baseRate: 0,
    rateType: 'DAILY',
    depositAmount: 0,
    minimumRentalDays: 1,
    validFrom: '',
    validTo: '',
    tags: [],
    isDefault: false,
  });

  // Fetch pricing details
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing', pricingId],
    queryFn: async () => {
      const pricingData = await hateoasClient.getResource<Pricing>('pricings', pricingId);
      
      // Fetch tags from the link if available
      if (pricingData._links?.tags?.href) {
        try {
          const tagsResponse = await hateoasClient.followLink<{ _embedded?: { pricingTags?: PricingTag[] } }>(
            pricingData,
            'tags'
          );
          // Extract tags from embedded collection (response uses 'pricingTags' field)
          pricingData.tags = tagsResponse._embedded?.pricingTags || [];
        } catch (error) {
          console.error('Failed to fetch pricing tags:', error);
          pricingData.tags = [];
        }
      }
      
      return pricingData;
    },
  });

  // Populate form when pricing data is loaded
  useEffect(() => {
    if (pricing) {
      let entityType: 'vehicle' | 'package' | 'booking' = 'vehicle';
      let entityId = 0;

      const vehicleId = pricing.vehicleId ?? extractEntityId(pricing._links?.vehicle?.href);
      const packageId = pricing.packageId ?? extractEntityId(pricing._links?.package?.href);
      const bookingId = pricing.bookingId ?? extractEntityId(pricing._links?.booking?.href);

      // Also check string URIs
      if (!vehicleId && typeof pricing.vehicle === 'string') {
        const extracted = extractEntityId(pricing.vehicle);
        if (extracted) {
          entityType = 'vehicle';
          entityId = extracted;
        }
      } else if (vehicleId) {
        entityType = 'vehicle';
        entityId = vehicleId;
      } else if (!packageId && typeof pricing.package === 'string') {
        const extracted = extractEntityId(pricing.package);
        if (extracted) {
          entityType = 'package';
          entityId = extracted;
        }
      } else if (packageId) {
        entityType = 'package';
        entityId = packageId;
      } else if (!bookingId && typeof pricing.booking === 'string') {
        const extracted = extractEntityId(pricing.booking);
        if (extracted) {
          entityType = 'booking';
          entityId = extracted;
        }
      } else if (bookingId) {
        entityType = 'booking';
        entityId = bookingId;
      }

      setFormData({
        entityType,
        entityId,
        baseRate: pricing.baseRate,
        rateType: pricing.rateType,
        depositAmount: pricing.depositAmount,
        minimumRentalDays: pricing.minimumRentalDays,
        validFrom: pricing.validFrom?.substring(0, 16) || '',
        validTo: pricing.validTo?.substring(0, 16) || '',
        tags: pricing.tags?.map((tag) => tag.name) || [],
        isDefault: pricing.isDefault || false,
      });
    }
  }, [pricing]);

  const updateMutation = useMutation({
    mutationFn: async (data: PricingFormState) => {
      // Build the request payload - EXCLUDE entity link as per Spring Data REST best practices
      // Entity associations should not be changed in UPDATE operations
      const payload: any = {
        baseRate: data.baseRate,
        rateType: data.rateType,
        depositAmount: data.depositAmount,
        minimumRentalDays: data.minimumRentalDays,
        validFrom: data.validFrom,
        validTo: data.validTo,
        isDefault: data.isDefault,
        // Always include tagNames, even if empty array (to clear tags)
        tagNames: data.tags || [],
      };

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

    updateMutation.mutate(formData);
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
      <form onSubmit={handleSubmit}>
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
                    className="font-semibold hover:underline"
                  >
                    {formData.entityType.charAt(0).toUpperCase() + formData.entityType.slice(1)}
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium">ID: {formData.entityId}</span>
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
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.tags')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="tags">{t('pricing.tags')} ({t('common.optional')})</Label>
                <TagInput
                  value={formData.tags || []}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                  placeholder={t('pricing.addTagsPlaceholder')}
                  suggestions={existingTags}
                />
                <p className="text-xs text-muted-foreground">
                  {t('pricing.form.tagsSuggestion')}
                </p>
              </div>
              
              {/* Default Pricing Checkbox */}
              <div className="mt-4 rounded-md border border-dashed p-3">
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
          <div className="flex gap-4 justify-end">
            <Link href={backUrl}>
              <Button type="button" variant="outline">
                {t('common.cancel')}
              </Button>
            </Link>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('pricing.form.updating') : t('pricing.form.updatePricing')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
