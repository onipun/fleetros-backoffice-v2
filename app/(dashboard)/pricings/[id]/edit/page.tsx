'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { EntitySelect } from '@/components/ui/entity-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { PricingFormData } from '@/lib/validations/schemas';
import type { Pricing } from '@/types';
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
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pricingId = params.id as string;

  const [formData, setFormData] = useState<PricingFormState>({
    entityType: 'vehicle',
    entityId: 0,
    baseRate: 0,
    rateType: 'DAILY',
    depositAmount: 0,
    minimumRentalDays: 1,
    validFrom: '',
    validTo: '',
  });

  // Fetch pricing details
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing', pricingId],
    queryFn: async () => {
      return hateoasClient.getResource<Pricing>('pricings', pricingId);
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

      if (vehicleId) {
        entityType = 'vehicle';
        entityId = vehicleId;
      } else if (packageId) {
        entityType = 'package';
        entityId = packageId;
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
      });
    }
  }, [pricing]);

  const updateMutation = useMutation({
    mutationFn: async (data: PricingFormState) => {
      // Build the request payload with HATEOAS link
      const payload: any = {
        baseRate: data.baseRate,
        rateType: data.rateType,
        depositAmount: data.depositAmount,
        minimumRentalDays: data.minimumRentalDays,
        validFrom: data.validFrom,
        validTo: data.validTo,
      };

  // Add the appropriate entity link
      if (data.entityType === 'vehicle' && data.entityId > 0) {
        payload.vehicle = `/api/vehicles/${data.entityId}`;
      } else if (data.entityType === 'package' && data.entityId > 0) {
        payload.package = `/api/packages/${data.entityId}`;
      } else if (data.entityType === 'booking' && data.entityId > 0) {
        payload.booking = `/api/bookings/${data.entityId}`;
      }

      return hateoasClient.update('pricings', pricingId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing', pricingId] });
      queryClient.invalidateQueries({ queryKey: ['pricings'] });
      toast({
        title: 'Success',
        description: 'Pricing updated successfully',
      });
      router.push('/pricings');
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

    // Validation - require associated entity when applicable
    if (formData.entityId <= 0) {
      toast({
        title: 'Validation Error',
        description: `Please select a ${formData.entityType}`,
        variant: 'destructive',
      });
      return;
    }

    if (formData.baseRate <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Base rate must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (formData.depositAmount < 0) {
      toast({
        title: 'Validation Error',
        description: 'Deposit amount cannot be negative',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.validFrom || !formData.validTo) {
      toast({
        title: 'Validation Error',
        description: 'Please select valid from and to dates',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.validFrom) >= new Date(formData.validTo)) {
      toast({
        title: 'Validation Error',
        description: 'Valid From date must be before Valid To date',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading pricing details...</p>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-destructive">Pricing not found</p>
        <Link href="/pricings">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/pricings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Pricing</h1>
          <p className="text-muted-foreground">Update pricing configuration</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Entity Information */}
          <Card>
            <CardHeader>
              <CardTitle>Entity Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="entityType">Entity Type *</Label>
                  <select
                    id="entityType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.entityType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        entityType: e.target.value as 'vehicle' | 'package' | 'booking',
                        entityId: 0, // Reset entity ID when type changes
                      })
                    }
                    required
                  >
                    <option value="vehicle">Vehicle</option>
                    <option value="package">Package</option>
                    <option value="booking">Booking</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select the type of entity this pricing applies to
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entityId">
                    {formData.entityType.charAt(0).toUpperCase() + formData.entityType.slice(1)} *
                  </Label>
                  <EntitySelect
                    entityType={formData.entityType}
                    value={formData.entityId || undefined}
                    onChange={(id) => setFormData({ ...formData, entityId: id })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Search and select the {formData.entityType}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rateType">Rate Type *</Label>
                  <select
                    id="rateType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.rateType}
                    onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
                    required
                  >
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="FLAT">Flat Rate</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Billing frequency for this pricing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumRentalDays">Minimum Rental Days *</Label>
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
                    Minimum number of days for rental
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Details */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="baseRate">Base Rate *</Label>
                  <CurrencyInput
                    id="baseRate"
                    value={formData.baseRate}
                    onChange={(value) => setFormData({ ...formData, baseRate: value })}
                    currency="MYR"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Base rate per period in Malaysian Ringgit
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount *</Label>
                  <CurrencyInput
                    id="depositAmount"
                    value={formData.depositAmount}
                    onChange={(value) => setFormData({ ...formData, depositAmount: value })}
                    currency="MYR"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Required security deposit amount
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validity Period */}
          <Card>
            <CardHeader>
              <CardTitle>Validity Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From *</Label>
                  <DateTimePicker
                    id="validFrom"
                    value={formData.validFrom}
                    onChange={(value) => setFormData({ ...formData, validFrom: value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Start date and time for this pricing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validTo">Valid To *</Label>
                  <DateTimePicker
                    id="validTo"
                    value={formData.validTo}
                    onChange={(value) => setFormData({ ...formData, validTo: value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    End date and time for this pricing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <Link href="/pricings">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Pricing'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
