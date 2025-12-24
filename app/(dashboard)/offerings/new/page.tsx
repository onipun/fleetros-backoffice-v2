'use client';

import { OfferingMultiPricingPanel, type OfferingPricingFormData } from '@/components/offering/offering-multi-pricing-panel';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function NewOfferingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLocale();

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
      { value: 'HOMESTAY' as OfferingType, label: t('offering.types.homestay') },
      { value: 'VILLA' as OfferingType, label: t('offering.types.villa') },
      { value: 'CHAUFFEUR' as OfferingType, label: t('offering.types.chauffeur') },
      { value: 'AIRPORT_PICKUP' as OfferingType, label: t('offering.types.airportPickup') },
      { value: 'FULL_TANK' as OfferingType, label: t('offering.types.fullTank') },
      { value: 'TOLL_PASS' as OfferingType, label: t('offering.types.tollPass') },
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

  // Predefined inventory settings for each offering type
  const offeringTypeDefaults: Record<OfferingType, {
    inventoryMode: InventoryMode;
    consumableType: ConsumableType;
    availability: number;
    maxQuantityPerBooking: number;
    purchaseLimitPerBooking: number | null;
  }> = useMemo(() => ({
    GPS: { inventoryMode: 'SHARED', consumableType: 'RETURNABLE', availability: 100, maxQuantityPerBooking: 5, purchaseLimitPerBooking: null },
    INSURANCE: { inventoryMode: 'SHARED', consumableType: 'SERVICE', availability: 9999, maxQuantityPerBooking: 1, purchaseLimitPerBooking: null },
    CHILD_SEAT: { inventoryMode: 'SHARED', consumableType: 'RETURNABLE', availability: 20, maxQuantityPerBooking: 3, purchaseLimitPerBooking: null },
    HOMESTAY: { inventoryMode: 'EXCLUSIVE', consumableType: 'ACCOMMODATION', availability: 1, maxQuantityPerBooking: 1, purchaseLimitPerBooking: null },
    VILLA: { inventoryMode: 'EXCLUSIVE', consumableType: 'ACCOMMODATION', availability: 1, maxQuantityPerBooking: 1, purchaseLimitPerBooking: null },
    CHAUFFEUR: { inventoryMode: 'EXCLUSIVE', consumableType: 'SERVICE', availability: 1, maxQuantityPerBooking: 1, purchaseLimitPerBooking: null },
    AIRPORT_PICKUP: { inventoryMode: 'SHARED', consumableType: 'SERVICE', availability: 9999, maxQuantityPerBooking: 1, purchaseLimitPerBooking: null },
    FULL_TANK: { inventoryMode: 'SHARED', consumableType: 'CONSUMABLE', availability: 9999, maxQuantityPerBooking: 1, purchaseLimitPerBooking: 1 },
    TOLL_PASS: { inventoryMode: 'SHARED', consumableType: 'CONSUMABLE', availability: 9999, maxQuantityPerBooking: 1, purchaseLimitPerBooking: 1 },
    OTHER: { inventoryMode: 'SHARED', consumableType: 'RETURNABLE', availability: 100, maxQuantityPerBooking: 5, purchaseLimitPerBooking: null },
  }), []);

  // Auto-apply predefined settings when offering type changes
  useEffect(() => {
    const defaults = offeringTypeDefaults[formData.offeringType];
    if (defaults) {
      setFormData(prev => ({
        ...prev,
        inventoryMode: defaults.inventoryMode,
        consumableType: defaults.consumableType,
        availability: defaults.availability,
        maxQuantityPerBooking: defaults.maxQuantityPerBooking,
        purchaseLimitPerBooking: defaults.purchaseLimitPerBooking,
      }));
    }
  }, [formData.offeringType, offeringTypeDefaults]);

  // Auto-adjust settings based on inventory mode and consumable type
  useEffect(() => {
    if (formData.inventoryMode === 'EXCLUSIVE') {
      // EXCLUSIVE offerings should have availability of 1
      setFormData(prev => ({
        ...prev,
        availability: 1,
        maxQuantityPerBooking: 1,
      }));
    }
    if (formData.consumableType === 'CONSUMABLE') {
      // CONSUMABLE items typically have purchaseLimitPerBooking of 1
      setFormData(prev => ({
        ...prev,
        purchaseLimitPerBooking: prev.purchaseLimitPerBooking ?? 1,
      }));
    }
  }, [formData.inventoryMode, formData.consumableType]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return hateoasClient.create<Offering>('offerings', data);
    },
    onSuccess: async (offering: Offering) => {
      // Create offering prices if user provided any via the multi-pricing panel
      const validPricings = pricingsData.filter((p) => p.baseRate > 0 && (p.neverExpires || (p.validFrom && p.validTo)));

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
              neverExpires: pricing.neverExpires || false,
              validFrom: pricing.neverExpires ? undefined : (pricing.validFrom || undefined),
              validTo: pricing.neverExpires ? undefined : (pricing.validTo || undefined),
              description: pricing.description || undefined,
            } as any;

            await createOfferingPrice(Number(offering.id), payload);
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

      toast({
        title: t('common.success'),
        description: t('toast.createSuccess'),
      });
      await queryClient.invalidateQueries({ queryKey: ['offerings'] });
      await queryClient.invalidateQueries({ queryKey: ['offerings-search'] });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
          <h1 className="text-3xl font-bold">{t('offering.newOffering')}</h1>
          <p className="text-muted-foreground">{t('offering.createDescription')}</p>
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

          {/* Multi-pricing (add multiple offering pricing rules like vehicle flow) */}
          <div className="space-y-6">
            <OfferingMultiPricingPanel onDataChange={setPricingsData} entityInfo={{ type: 'Offering', id: 'New', name: formData.name || 'New Offering' }} />
          </div>            {/* Actions */}
            <div className="flex justify-end gap-4">
            <Link href="/offerings">
              <Button variant="outline" type="button">
                {t('common.cancel')}
              </Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {createMutation.isPending ? t('common.creating') : t('offering.newOffering')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
