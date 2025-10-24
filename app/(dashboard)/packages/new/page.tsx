'use client';

import { OfferingMultiSelect } from '@/components/offering/offering-multi-select';
import { PricingPanel, type PricingFormData } from '@/components/pricing/pricing-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceModifier: 0.9,
    validFrom: '',
    validTo: '',
    minRentalDays: 2,
  });

  const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);

  const [pricingData, setPricingData] = useState<PricingFormData>({
    baseRate: 0,
    rateType: 'DAILY',
    depositAmount: 0,
    minimumRentalDays: 1,
    validFrom: '',
    validTo: '',
  });

  const { data: offeringsData, isLoading: offeringsLoading, error: offeringsError } = useQuery({
    queryKey: ['offerings', 'all'],
    queryFn: async () => {
      return hateoasClient.getCollection<Offering>('offerings', { page: 0, size: 100 });
    },
  });

  const offerings = offeringsData ? parseHalResource<Offering>(offeringsData, 'offerings') : [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { offerings: Offering[] }) => {
      return hateoasClient.create<Package>('packages', data);
    },
    onSuccess: async (pkg: Package) => {
      try {
        const packageId = pkg.id;
        if (packageId && pricingData.baseRate > 0) {
          const pricingPayload = {
            ...pricingData,
            package: `/api/packages/${packageId}`,
            validFrom: formData.validFrom,
            validTo: formData.validTo,
          };
          await hateoasClient.create('pricings', pricingPayload);
          toast({
            title: 'Success',
            description: 'Package and pricing created successfully',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Package created successfully',
          });
        }
      } catch (error) {
        console.error('Failed to create pricing:', error);
        toast({
          title: 'Warning',
          description: 'Package created but pricing failed',
          variant: 'destructive',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['pricings'] });
      router.push('/packages');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.validFrom || !formData.validTo) {
      toast({
        title: 'Validation Error',
        description: 'Please select both valid from and valid to dates.',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.validFrom) >= new Date(formData.validTo)) {
      toast({
        title: 'Validation Error',
        description: 'Valid from date must be before valid to date.',
        variant: 'destructive',
      });
      return;
    }

    const selectedOfferings = offerings.filter(
      (item) => item.id != null && selectedOfferingIds.includes(item.id)
    );

    createMutation.mutate({
      ...formData,
      offerings: selectedOfferings,
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
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Package</h1>
          <p className="text-muted-foreground">Add a new rental package</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Weekend Special"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the package benefits..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="priceModifier">Price Modifier *</Label>
                <Input
                  id="priceModifier"
                  name="priceModifier"
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.priceModifier}
                  onChange={handleInputChange}
                  placeholder="0.90"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  0.90 = 10% discount, 1.00 = no change, 1.10 = 10% increase
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRentalDays">Minimum Rental Days *</Label>
                <Input
                  id="minRentalDays"
                  name="minRentalDays"
                  type="number"
                  min="1"
                  value={formData.minRentalDays}
                  onChange={handleInputChange}
                  placeholder="2"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Validity Period */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Validity Period</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From *</Label>
                <DateTimePicker
                  id="validFrom"
                  value={formData.validFrom}
                  onChange={handleDateChange('validFrom')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To *</Label>
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

        <div className="mt-6">
          <PricingPanel onDataChange={setPricingData} showValidity={false} />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/packages">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Package'}
          </Button>
        </div>
      </form>
    </div>
  );
}
