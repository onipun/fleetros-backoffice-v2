'use client';

import { OfferingMultiPricingPanel, type OfferingPricingFormData } from '@/components/offering/offering-multi-pricing-panel';
import { OfferingPricePanel } from '@/components/offering/offering-price-panel';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { createOfferingPrice } from '@/lib/api/offering-price-api';
import { preventEnterSubmission } from '@/lib/form-utils';
import type { ConsumableType, InventoryMode, Offering, OfferingType } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function EditOfferingPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const offeringId = params.id as string;
  const { t } = useLocale();

  // Debug logging
  console.log('EditOfferingPage params:', params);
  console.log('EditOfferingPage offeringId:', offeringId, 'Type:', typeof offeringId);

  const [formData, setFormData] = useState({
    name: '',
    offeringType: 'GPS' as OfferingType,
    availability: 100,
    price: 0,
    maxQuantityPerBooking: 1,
    isMandatory: false,
    description: '',
    // New inventory management fields
    inventoryMode: 'SHARED' as InventoryMode,
    consumableType: 'RETURNABLE' as ConsumableType,
    purchaseLimitPerBooking: null as number | null,
  });
  const [pricingsData, setPricingsData] = useState<OfferingPricingFormData[]>([]);

  const offeringTypeOptions = useMemo(
    () => [
      { value: 'GPS' as OfferingType, label: t('offering.types.gps') },
      { value: 'INSURANCE' as OfferingType, label: t('offering.types.insurance') },
      { value: 'CHILD_SEAT' as OfferingType, label: t('offering.types.childSeat') },
      { value: 'WIFI' as OfferingType, label: t('offering.types.wifi') },
      { value: 'ADDITIONAL_DRIVER' as OfferingType, label: t('offering.types.additionalDriver') },
      { value: 'OTHER' as OfferingType, label: t('offering.types.other') },
    ],
    [t],
  );

  const inventoryModeOptions = useMemo(
    () => [
      { value: 'SHARED' as InventoryMode, label: t('offering.inventoryMode.shared'), description: t('offering.inventoryMode.sharedDesc') },
      { value: 'EXCLUSIVE' as InventoryMode, label: t('offering.inventoryMode.exclusive'), description: t('offering.inventoryMode.exclusiveDesc') },
    ],
    [t],
  );

  const consumableTypeOptions = useMemo(
    () => [
      { value: 'RETURNABLE' as ConsumableType, label: t('offering.consumableType.returnable'), description: t('offering.consumableType.returnableDesc') },
      { value: 'CONSUMABLE' as ConsumableType, label: t('offering.consumableType.consumable'), description: t('offering.consumableType.consumableDesc') },
      { value: 'SERVICE' as ConsumableType, label: t('offering.consumableType.service'), description: t('offering.consumableType.serviceDesc') },
      { value: 'ACCOMMODATION' as ConsumableType, label: t('offering.consumableType.accommodation'), description: t('offering.consumableType.accommodationDesc') },
    ],
    [t],
  );

  // Fetch offering details
  const { data: offering, isLoading } = useQuery({
    queryKey: ['offering', offeringId],
    queryFn: async () => {
      return hateoasClient.getResource<Offering>('offerings', offeringId);
    },
  });

  // Pre-populate form when data loads
  useEffect(() => {
    if (offering) {
      setFormData({
        name: offering.name || '',
        offeringType: offering.offeringType || 'GPS',
        availability: offering.availability || 100,
        price: offering.price || 0,
        maxQuantityPerBooking: offering.maxQuantityPerBooking || 1,
        isMandatory: offering.isMandatory || false,
        description: offering.description || '',
        // New inventory management fields
        inventoryMode: offering.inventoryMode || 'SHARED',
        consumableType: offering.consumableType || 'RETURNABLE',
        purchaseLimitPerBooking: offering.purchaseLimitPerBooking ?? null,
      });
    }
  }, [offering]);

  // Auto-adjust settings based on inventory mode (only for new selections, not when loading existing data)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  useEffect(() => {
    if (offering && !hasLoadedInitialData) {
      setHasLoadedInitialData(true);
    }
  }, [offering, hasLoadedInitialData]);

  useEffect(() => {
    if (!hasLoadedInitialData) return;
    
    if (formData.inventoryMode === 'EXCLUSIVE' && offering?.inventoryMode !== 'EXCLUSIVE') {
      // Only auto-adjust if user just switched to EXCLUSIVE
      setFormData(prev => ({
        ...prev,
        availability: 1,
        maxQuantityPerBooking: 1,
      }));
    }
  }, [formData.inventoryMode, hasLoadedInitialData, offering?.inventoryMode]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return hateoasClient.update<Offering>('offerings', offeringId, data);
    },
    onSuccess: async () => {
      // After updating offering, create any new pricing rules provided via multi-panel
      const validPricings = pricingsData.filter((p) => p.baseRate > 0 && p.validFrom && p.validTo);

      if (validPricings.length > 0) {
        let successCount = 0;
        let failCount = 0;

        for (const pricing of validPricings) {
          try {
            const payload = {
              baseRate: Number(pricing.baseRate),
              rateType: pricing.rateType,
              priority: pricing.priority,
              active: pricing.active,
              isDefault: Boolean(pricing.isDefault),
              minimumQuantity: pricing.minimumQuantity,
              maximumQuantity: pricing.maximumQuantity,
              validFrom: pricing.validFrom || undefined,
              validTo: pricing.validTo || undefined,
              description: pricing.description || undefined,
            } as any;

            await createOfferingPrice(Number(offeringId), payload);
            successCount++;
          } catch (err) {
            console.error('Failed to create offering price:', err);
            failCount++;
          }
        }

        toast({
          title: t('common.success'),
          description:
            successCount > 0
              ? t('pricing.multiPricing.createMultipleSuccess').replace('{count}', successCount.toString())
              : t('pricing.multiPricing.createMultiplePartialSuccess'),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['offerings'] });
      await queryClient.invalidateQueries({ queryKey: ['offerings-search'] });
      await queryClient.invalidateQueries({ queryKey: ['offering', offeringId] });
      toast({
        title: t('common.success'),
        description: t('toast.updateSuccess'),
      });
      router.push('/offerings');
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return hateoasClient.delete('offerings', offeringId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offerings'] });
      await queryClient.invalidateQueries({ queryKey: ['offerings-search'] });
      toast({
        title: t('common.success'),
        description: 'Offering deleted successfully',
      });
      router.push('/offerings');
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${formData.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : name === 'offeringType' ? (value as OfferingType) : value,
    }));
  };

  const handlePriceChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      price: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t('offering.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/offerings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('offering.editOffering')}</h1>
          <p className="text-muted-foreground">{t('offering.editDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmission}>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('offering.basicInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('offering.name')} {t('common.required')}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('offering.namePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offeringType">
                    {t('offering.typeLabel')} {t('common.required')}
                  </Label>
                  <select
                    id="offeringType"
                    name="offeringType"
                    value={formData.offeringType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {offeringTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('offering.description')}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t('offering.descriptionPlaceholder')}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inventory Settings - NEW */}
            <Card>
              <CardHeader>
                <CardTitle>{t('offering.inventorySettings')}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('offering.inventorySettingsHelp')}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inventoryMode">
                    {t('offering.inventoryModeLabel')} {t('common.required')}
                  </Label>
                  <select
                    id="inventoryMode"
                    name="inventoryMode"
                    value={formData.inventoryMode}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {inventoryModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground">
                    {inventoryModeOptions.find(o => o.value === formData.inventoryMode)?.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consumableType">
                    {t('offering.consumableTypeLabel')} {t('common.required')}
                  </Label>
                  <select
                    id="consumableType"
                    name="consumableType"
                    value={formData.consumableType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {consumableTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground">
                    {consumableTypeOptions.find(o => o.value === formData.consumableType)?.description}
                  </p>
                </div>

                {formData.inventoryMode === 'EXCLUSIVE' && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {t('offering.exclusiveNote')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Pricing & Availability */}
            <Card>
              <CardHeader>
                <CardTitle>{t('offering.pricingAvailability')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    {t('offering.unitPriceLabel')} {t('common.required')}
                  </Label>
                  <CurrencyInput
                    id="price"
                    value={formData.price}
                    onChange={handlePriceChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">
                    {t('offering.availableUnits')} {t('common.required')}
                  </Label>
                  <Input
                    id="availability"
                    name="availability"
                    type="number"
                    min="0"
                    value={formData.availability}
                    onChange={handleInputChange}
                    placeholder={t('offering.availabilityPlaceholder')}
                    required
                    disabled={formData.inventoryMode === 'EXCLUSIVE'}
                  />
                  {formData.inventoryMode === 'EXCLUSIVE' && (
                    <p className="text-sm text-muted-foreground">
                      {t('offering.exclusiveAvailabilityNote')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxQuantityPerBooking">
                    {t('offering.maxQuantityPerBooking')} {t('common.required')}
                  </Label>
                  <Input
                    id="maxQuantityPerBooking"
                    name="maxQuantityPerBooking"
                    type="number"
                    min="1"
                    value={formData.maxQuantityPerBooking}
                    onChange={handleInputChange}
                    placeholder={t('offering.quantityPlaceholder')}
                    required
                    disabled={formData.inventoryMode === 'EXCLUSIVE'}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isMandatory"
                    checked={formData.isMandatory}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isMandatory: checked as boolean }))
                    }
                  />
                  <Label htmlFor="isMandatory" className="cursor-pointer">
                    {t('offering.mandatoryToggleLabel')}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Limits - for CONSUMABLE types */}
            <Card>
              <CardHeader>
                <CardTitle>{t('offering.purchaseLimits')}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('offering.purchaseLimitsHelp')}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseLimitPerBooking">
                    {t('offering.purchaseLimitPerBooking')}
                  </Label>
                  <Input
                    id="purchaseLimitPerBooking"
                    name="purchaseLimitPerBooking"
                    type="number"
                    min="1"
                    value={formData.purchaseLimitPerBooking ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                      setFormData((prev) => ({ ...prev, purchaseLimitPerBooking: value }));
                    }}
                    placeholder={t('offering.purchaseLimitPlaceholder')}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('offering.purchaseLimitDescription')}
                  </p>
                </div>

                {formData.consumableType === 'CONSUMABLE' && !formData.purchaseLimitPerBooking && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t('offering.consumableLimitSuggestion')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Multi-pricing: allow adding multiple offering pricing rules inline (non-persistent until created) */}
          <div className="space-y-6">
            <OfferingMultiPricingPanel onDataChange={setPricingsData} entityInfo={{ type: 'Offering', id: offeringId, name: offering?.name }} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="destructive" 
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Offering'}
          </Button>
          <div className="flex gap-4">
            <Link href="/offerings">
              <Button variant="outline" type="button">
                {t('common.cancel')}
              </Button>
            </Link>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? t('common.updating') : t('offering.updateAction')}
            </Button>
          </div>
        </div>
      </form>

      {/* Offering Price Management */}
      {offering && offeringId && typeof offeringId === 'string' && offeringId.trim() !== '' && !isNaN(parseInt(offeringId)) && (
        <OfferingPricePanel
          offeringId={parseInt(offeringId)}
          offeringName={offering.name || 'Offering'}
        />
      )}
    </div>
  );
}
