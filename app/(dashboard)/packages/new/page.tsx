'use client';

import { PricingPanel, type PricingFormData } from '@/components/pricing/pricing-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Package } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

  const [pricingData, setPricingData] = useState<PricingFormData>({
    baseRate: 0,
    rateType: 'DAILY',
    depositAmount: 0,
    minimumRentalDays: 1,
    validFrom: '',
    validTo: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
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
    createMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
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
                <Input
                  id="validFrom"
                  name="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To *</Label>
                <Input
                  id="validTo"
                  name="validTo"
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
          </Card>
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
