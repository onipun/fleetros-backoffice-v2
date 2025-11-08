'use client';

import { OfferingMultiSelect } from '@/components/offering/offering-multi-select';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { preventEnterSubmission } from '@/lib/form-utils';
import { parseHalResource } from '@/lib/utils';
import type { Offering, Package } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewPackagePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLocale();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceModifier: 0.9,
    validFrom: '',
    validTo: '',
    minRentalDays: 2,
  });

  const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);

  const { data: offeringsData, isLoading: offeringsLoading, error: offeringsError } = useQuery({
    queryKey: ['offerings', 'all'],
    queryFn: async () => {
      return hateoasClient.getCollection<Offering>('offerings', { page: 0, size: 100 });
    },
  });

  const offerings = offeringsData ? parseHalResource<Offering>(offeringsData, 'offerings') : [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { offeringUris: string[] }) => {
      // First create the package without offerings
      const { offeringUris, ...packageData } = data;
      const createdPackage = await hateoasClient.create<Package>('packages', packageData);
      
      // Then associate offerings if any were selected
      if (createdPackage.id && offeringUris.length > 0) {
        const uriList = offeringUris.join('\n');
        await hateoasClient.addAssociation(
          'packages',
          createdPackage.id,
          'offerings',
          uriList
        );
      }
      
      return createdPackage;
    },
    onSuccess: async (pkg: Package) => {
      toast({
        title: t('common.success'),
        description: t('package.createSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      router.push('/packages');
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

    if (!formData.validFrom || !formData.validTo) {
      toast({
        title: t('package.validation.title'),
        description: t('package.validation.requiredDates'),
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.validFrom) >= new Date(formData.validTo)) {
      toast({
        title: t('package.validation.title'),
        description: t('package.validation.dateOrder'),
        variant: 'destructive',
      });
      return;
    }

    // Build offering URIs for HATEOAS association
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
    const offeringUris = selectedOfferingIds.map(
      (id) => `${baseUrl}/api/offerings/${id}`
    );

    createMutation.mutate({
      ...formData,
      offeringUris,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleDateChange = (field: 'validFrom' | 'validTo') => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/packages">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('package.newPackage')}</h1>
          <p className="text-muted-foreground">{t('package.createDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmission}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('package.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('package.name')} {t('common.required')}
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t('package.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('package.description')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('package.descriptionPlaceholder')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>{t('package.requirements')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="priceModifier">
                  {t('package.priceModifierLabel')} {t('common.required')}
                </Label>
                <Input
                  id="priceModifier"
                  name="priceModifier"
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.priceModifier}
                  onChange={handleInputChange}
                  placeholder={t('package.discountRatePlaceholder')}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('package.priceModifierHelper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRentalDays">
                  {t('package.minRentalDays')} {t('common.required')}
                </Label>
                <Input
                  id="minRentalDays"
                  name="minRentalDays"
                  type="number"
                  min="1"
                  value={formData.minRentalDays}
                  onChange={handleInputChange}
                  placeholder={t('package.minRentalDaysPlaceholder')}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Validity Period */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('package.validityPeriod')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom">
                  {t('package.validFromLabel')} {t('common.required')}
                </Label>
                <DateTimePicker
                  id="validFrom"
                  value={formData.validFrom}
                  onChange={handleDateChange('validFrom')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">
                  {t('package.validToLabel')} {t('common.required')}
                </Label>
                <DateTimePicker
                  id="validTo"
                  value={formData.validTo}
                  onChange={handleDateChange('validTo')}
                />
              </div>
            </CardContent>
          </Card>

          <OfferingMultiSelect
            className="md:col-span-2"
            offerings={offerings}
            selectedIds={selectedOfferingIds}
            onChange={setSelectedOfferingIds}
            isLoading={offeringsLoading}
            errorMessage={offeringsError instanceof Error ? offeringsError.message : undefined}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/packages">
            <Button variant="outline" type="button">
              {t('common.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending ? t('common.creating') : t('package.createPackage')}
          </Button>
        </div>
      </form>
    </div>
  );
}
