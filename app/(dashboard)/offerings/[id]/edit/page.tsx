'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Offering, OfferingType } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditOfferingPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const offeringId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    offeringType: 'GPS' as OfferingType,
    availability: 100,
    price: 0,
    maxQuantityPerBooking: 1,
    isMandatory: false,
    description: '',
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offerings'] });
      queryClient.invalidateQueries({ queryKey: ['offering', offeringId] });
      toast({
        title: 'Success',
        description: 'Offering updated successfully',
      });
      router.push('/offerings');
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
        <p className="text-muted-foreground">Loading offering...</p>
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
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Offering</h1>
          <p className="text-muted-foreground">Update offering details</p>
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
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., GPS Navigation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offeringType">Offering Type *</Label>
                <select
                  id="offeringType"
                  name="offeringType"
                  value={formData.offeringType}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="GPS">GPS</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="CHILD_SEAT">Child Seat</option>
                  <option value="WIFI">WiFi</option>
                  <option value="ADDITIONAL_DRIVER">Additional Driver</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the offering..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (per unit) *</Label>
                <CurrencyInput
                  id="price"
                  value={formData.price}
                  onChange={handlePriceChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Available Units *</Label>
                <Input
                  id="availability"
                  name="availability"
                  type="number"
                  min="0"
                  value={formData.availability}
                  onChange={handleInputChange}
                  placeholder="100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxQuantityPerBooking">Max Quantity per Booking *</Label>
                <Input
                  id="maxQuantityPerBooking"
                  name="maxQuantityPerBooking"
                  type="number"
                  min="1"
                  value={formData.maxQuantityPerBooking}
                  onChange={handleInputChange}
                  placeholder="1"
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
                  Mandatory offering (automatically included in all bookings)
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/offerings">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Updating...' : 'Update Offering'}
          </Button>
        </div>
      </form>
    </div>
  );
}
