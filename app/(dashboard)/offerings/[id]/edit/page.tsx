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
import type { Offering, OfferingType } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
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
      });
    }
  }, [offering]);

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

      queryClient.invalidateQueries({ queryKey: ['offerings'] });
      queryClient.invalidateQueries({ queryKey: ['offering', offeringId] });
      toast({
        title: t('common.success'),
        description: t('toast.updateSuccess'),
      });
      router.push('/offerings');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offerings'] });
      toast({
        title: t('common.success'),
        description: 'Offering deleted successfully',
      });
      router.push('/offerings');
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
                />
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
        </div>

          {/* Multi-pricing: allow adding multiple offering pricing rules inline (non-persistent until created) */}
          <div className="space-y-6">
            <OfferingMultiPricingPanel onDataChange={setPricingsData} entityInfo={{ type: 'Offering', id: offeringId, name: offering?.name }} />
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
