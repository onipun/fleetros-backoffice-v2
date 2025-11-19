'use client';

import { OfferingMultiSelect } from '@/components/offering/offering-multi-select';
import { PackageBannerUpload } from '@/components/package/package-banner-upload';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { preventEnterSubmission } from '@/lib/form-utils';
import { parseHalResource } from '@/lib/utils';
import type { Offering, Package, PackageImage, PackageModifierType } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
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
    priceModifier: 0,
    modifierType: 'FIXED' as PackageModifierType,
    allowDiscountOnModifier: true,
    validFrom: '',
    validTo: '',
    minRentalDays: 2,
  });

  const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);
  const [createdPackageId, setCreatedPackageId] = useState<number | undefined>(undefined);
  const [bannerImage, setBannerImage] = useState<PackageImage | null>(null);

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
      // Store package ID to enable banner upload
      setCreatedPackageId(pkg.id);
      
      toast({
        title: t('common.success'),
        description: t('package.createSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      
      // Only redirect if banner was not uploaded
      if (!bannerImage) {
        router.push('/packages');
      }
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
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('package.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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

          {/* Pricing Configuration */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('package.pricingConfig')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('package.pricingConfigDescription')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="modifierType">
                    {t('package.modifierType')} {t('common.required')}
                  </Label>
                  <select
                    id="modifierType"
                    name="modifierType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.modifierType}
                    onChange={(e) => setFormData(prev => ({ ...prev, modifierType: e.target.value as PackageModifierType }))}
                    required
                  >
                    <option value="FIXED">{t('package.modifierType.fixed')}</option>
                    <option value="PERCENTAGE">{t('package.modifierType.percentage')}</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {formData.modifierType === 'FIXED' 
                      ? t('package.modifierType.fixedHelp')
                      : t('package.modifierType.percentageHelp')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceModifier">
                    {t('package.priceModifier')} {t('common.required')}
                  </Label>
                  <Input
                    id="priceModifier"
                    name="priceModifier"
                    type="number"
                    step="0.01"
                    value={formData.priceModifier}
                    onChange={handleInputChange}
                    placeholder={formData.modifierType === 'FIXED' ? '50.00' : '20'}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.modifierType === 'FIXED'
                      ? t('package.priceModifier.fixedExample')
                      : t('package.priceModifier.percentageExample')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="allowDiscountOnModifier"
                  checked={formData.allowDiscountOnModifier}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, allowDiscountOnModifier: checked === true }))
                  }
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="allowDiscountOnModifier"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {t('package.allowDiscountOnModifier')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('package.allowDiscountOnModifierDescription')}
                  </p>
                  {!formData.allowDiscountOnModifier && (
                    <div className="flex items-start gap-2 mt-2 rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-900 dark:text-amber-100">
                        {t('package.allowDiscountOnModifierWarning')}
                      </p>
                    </div>
                  )}
                </div>
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

          {/* Banner Image Upload */}
          <PackageBannerUpload
            className="md:col-span-2"
            packageId={createdPackageId}
            onImageChange={setBannerImage}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/packages">
            <Button variant="outline" type="button">
              {t('common.cancel')}
            </Button>
          </Link>
          {!createdPackageId ? (
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {createMutation.isPending ? t('common.creating') : t('package.createPackage')}
            </Button>
          ) : (
            <Button type="button" onClick={() => router.push('/packages')}>
              {t('common.done')}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
