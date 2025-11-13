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
import { parseHalResource } from '@/lib/utils';
import type { HATEOASCollection, Offering, Package } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const packageId = params.id as string;
  const { t } = useLocale();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceModifier: 1,
    validFrom: '',
    validTo: '',
    minRentalDays: 2,
  });
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);
  const [initialOfferingsApplied, setInitialOfferingsApplied] = useState(false);

  // Fetch package details
  const { data: pkg, isLoading } = useQuery({
    queryKey: ['package', packageId],
    queryFn: async () => {
      return hateoasClient.getResource<Package>('packages', packageId);
    },
  });

  const packageOfferingsLink = pkg?._links?.offerings?.href;

  const {
    data: packageOfferingsData,
    isLoading: packageOfferingsLoading,
    error: packageOfferingsError,
  } = useQuery<HATEOASCollection<Offering>>({
    queryKey: ['package', packageId, 'offerings', packageOfferingsLink],
    queryFn: async () => hateoasClient.followLink<HATEOASCollection<Offering>>(packageOfferingsLink!),
    enabled: Boolean(packageOfferingsLink),
  });

  const { data: offeringsData, isLoading: offeringsLoading, error: offeringsError } = useQuery({
    queryKey: ['offerings', 'all'],
    queryFn: async () => {
      return hateoasClient.getCollection<Offering>('offerings', { page: 0, size: 100 });
    },
  });

  const baseOfferings = useMemo(() => {
    if (!offeringsData) {
      return [] as Offering[];
    }
    return parseHalResource<Offering>(offeringsData, 'offerings');
  }, [offeringsData]);

  const packageOfferings = useMemo(() => {
    if (!packageOfferingsData) {
      return [] as Offering[];
    }
    return parseHalResource<Offering>(packageOfferingsData, 'offerings');
  }, [packageOfferingsData]);

  const resolvedPackageOfferings = packageOfferings.length > 0
    ? packageOfferings
    : Array.isArray(pkg?.offerings)
      ? pkg.offerings
      : [];

  const availableOfferings = useMemo(() => {
    if (resolvedPackageOfferings.length === 0) {
      return baseOfferings;
    }

    const seenIds = new Set<number>();
    const prioritized: Offering[] = [];

    resolvedPackageOfferings.forEach((pkgOffering) => {
      const id = pkgOffering.id;
      if (id == null || seenIds.has(id)) {
        return;
      }

      const match = baseOfferings.find((offering) => offering.id === id);
      prioritized.push(match ?? pkgOffering);
      seenIds.add(id);
    });

    const remaining = baseOfferings.filter((offering) => {
      const id = offering.id;
      return id == null || !seenIds.has(id);
    });

    return [...prioritized, ...remaining];
  }, [baseOfferings, resolvedPackageOfferings]);

  const isOfferingsLoading = offeringsLoading || packageOfferingsLoading;
  const offeringErrorMessage =
    (offeringsError instanceof Error ? offeringsError.message : undefined) ||
    (packageOfferingsError instanceof Error ? packageOfferingsError.message : undefined);

  // Pre-populate form when data loads
  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || '',
        description: pkg.description || '',
        priceModifier: 1,
        validFrom: pkg.validFrom || '',
        validTo: pkg.validTo || '',
        minRentalDays: pkg.minRentalDays || 2,
      });
    }
  }, [pkg]);

  useEffect(() => {
    setInitialOfferingsApplied(false);
    setSelectedOfferingIds([]);
  }, [packageId, packageOfferingsLink]);

  useEffect(() => {
    if (initialOfferingsApplied) {
      return;
    }

    if (!pkg) {
      return;
    }

    if (packageOfferingsLink && !packageOfferingsError) {
      if (packageOfferingsLoading || !packageOfferingsData) {
        return;
      }
    }

    const initialIds = resolvedPackageOfferings
      .map((item) => item.id)
      .filter((id): id is number => id != null);

    setSelectedOfferingIds(initialIds);
    setInitialOfferingsApplied(true);
  }, [
    initialOfferingsApplied,
    pkg,
    packageOfferingsLink,
    packageOfferingsLoading,
    packageOfferingsData,
    packageOfferingsError,
    resolvedPackageOfferings,
  ]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { offeringUris: string[] }) => {
      // First update the package without offerings
      const { offeringUris, ...packageData } = data;
      const updatedPackage = await hateoasClient.update<Package>('packages', packageId, packageData);
      
      // Then update the offerings association using PUT (replaces all)
      if (offeringUris.length > 0) {
        const uriList = offeringUris.join('\n');
        await hateoasClient.addAssociation(
          'packages',
          packageId,
          'offerings',
          uriList
        );
      } else {
        // If no offerings selected, remove all associations
        await hateoasClient.removeAssociation(
          'packages',
          packageId,
          'offerings'
        );
      }
      
      return updatedPackage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package', packageId] });
      queryClient.invalidateQueries({ queryKey: ['package', packageId, 'offerings'] });
      toast({
        title: t('common.success'),
        description: t('package.updateSuccess'),
      });
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

    updateMutation.mutate({
      ...formData,
      offeringUris,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t('package.loading')}</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">{t('package.editPackage')}</h1>
          <p className="text-muted-foreground">{t('package.editDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
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
            offerings={availableOfferings}
            selectedIds={selectedOfferingIds}
            onChange={setSelectedOfferingIds}
            isLoading={isOfferingsLoading}
            errorMessage={offeringErrorMessage}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/packages">
            <Button variant="outline" type="button">
              {t('common.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? t('common.updating') : t('package.updateAction')}
          </Button>
        </div>
      </form>
    </div>
  );
}
