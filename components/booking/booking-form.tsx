'use client';

import { OfferingMultiSelect } from '@/components/offering/offering-multi-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { EntitySelect } from '@/components/ui/entity-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { parseHalResource } from '@/lib/utils';
import { BookingStatus, type Booking, type Offering } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export interface BookingFormSubmission {
  vehicleId: number;
  packageId: number | null;
  discountId: number | null;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  insurancePolicy: string;
  totalDays: number;
  totalRentalFee: number;
  finalPrice: number;
  balancePayment: number;
  status: BookingStatus;
  offerings: Offering[];
}

export interface BookingFormProps {
  initialValues?: Partial<Booking>;
  onSubmit: (values: BookingFormSubmission) => void;
  isSubmitting?: boolean;
  submitLabel: string;
  onCancel?: () => void;
}

type BookingFormState = {
  vehicleId: number | null;
  packageId: number | null;
  discountId: number | null;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  insurancePolicy: string;
  totalDays: number;
  totalRentalFee: number;
  finalPrice: number;
  balancePayment: number;
  status: BookingStatus;
};

type TextField = 'pickupLocation' | 'dropoffLocation' | 'insurancePolicy';
type NumericField = 'totalDays' | 'totalRentalFee' | 'finalPrice' | 'balancePayment';

const defaultState: BookingFormState = {
  vehicleId: null,
  packageId: null,
  discountId: null,
  startDate: '',
  endDate: '',
  pickupLocation: '',
  dropoffLocation: '',
  insurancePolicy: '',
  totalDays: 1,
  totalRentalFee: 0,
  finalPrice: 0,
  balancePayment: 0,
  status: BookingStatus.PENDING,
};

export function BookingForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: BookingFormProps) {
  const [formState, setFormState] = useState<BookingFormState>(defaultState);
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: offeringsData, isLoading: offeringsLoading, error: offeringsError } = useQuery({
    queryKey: ['offerings', 'all'],
    queryFn: async () => hateoasClient.getCollection<Offering>('offerings', { page: 0, size: 100 }),
  });

  const offerings = useMemo(() => {
    if (!offeringsData) return [] as Offering[];
    return parseHalResource<Offering>(offeringsData, 'offerings');
  }, [offeringsData]);

  const initialOfferingDetails = useMemo(() => {
    if (!initialValues?.offerings) return [] as Offering[];
    return initialValues.offerings
      .map((item) => {
        if ('offering' in item && item.offering) {
          return item.offering;
        }
        if ('offeringType' in item) {
          return item as unknown as Offering;
        }
        return undefined;
      })
      .filter((offering): offering is Offering => Boolean(offering && offering.id != null));
  }, [initialValues?.offerings]);

  useEffect(() => {
    if (!initialValues) {
      setFormState(defaultState);
      setSelectedOfferingIds([]);
      return;
    }

    setFormState({
      vehicleId: initialValues.vehicleId ?? initialValues.vehicle?.id ?? null,
      packageId: initialValues.packageId ?? null,
      discountId: initialValues.discountId ?? null,
      startDate: initialValues.startDate || '',
      endDate: initialValues.endDate || '',
      pickupLocation: initialValues.pickupLocation || '',
      dropoffLocation: initialValues.dropoffLocation || '',
      insurancePolicy: initialValues.insurancePolicy || '',
      totalDays: initialValues.totalDays ?? 1,
      totalRentalFee: initialValues.totalRentalFee ?? 0,
      finalPrice: initialValues.finalPrice ?? 0,
      balancePayment: initialValues.balancePayment ?? 0,
      status: initialValues.status ?? BookingStatus.PENDING,
    });

    if (initialValues.offerings && Array.isArray(initialValues.offerings)) {
      const ids = initialValues.offerings
        .map((item) => {
          if ('offeringId' in item && item.offeringId != null) {
            return item.offeringId;
          }
          if ('offering' in item && item.offering && item.offering.id != null) {
            return item.offering.id;
          }
          if ('id' in item) {
            return (item as unknown as Offering).id ?? null;
          }
          return null;
        })
        .filter((id): id is number => id != null);
      setSelectedOfferingIds(ids);
    } else {
      setSelectedOfferingIds([]);
    }
  }, [initialValues]);

  const handleFieldChange = (field: TextField) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = event.target;
    setFormError(null);
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericChange = (field: NumericField, mode: 'int' | 'float' = 'float') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormError(null);

    if (value === '') {
      setFormState((prev) => ({ ...prev, [field]: 0 }));
      return;
    }

    const parsed = mode === 'int' ? parseInt(value, 10) : parseFloat(value);
    setFormState((prev) => ({
      ...prev,
      [field]: Number.isNaN(parsed) ? prev[field] : parsed,
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (value: string) => {
    setFormError(null);
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelect = (field: 'vehicleId' | 'packageId' | 'discountId') => (id: number | null) => {
    setFormError(null);
    setFormState((prev) => ({
      ...prev,
      [field]: id,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.vehicleId) {
      setFormError('Please select a vehicle for this booking.');
      return;
    }

    if (!formState.startDate || !formState.endDate) {
      setFormError('Start and end dates are required.');
      return;
    }

    if (new Date(formState.startDate) >= new Date(formState.endDate)) {
      setFormError('Start date must be earlier than end date.');
      return;
    }

    setFormError(null);

    const offeringMap = new Map<number, Offering>();

    offerings.forEach((offering) => {
      if (offering.id != null) {
        offeringMap.set(offering.id, offering);
      }
    });

    initialOfferingDetails.forEach((offering) => {
      if (offering.id != null && !offeringMap.has(offering.id)) {
        offeringMap.set(offering.id, offering);
      }
    });

    const selectedOfferings = selectedOfferingIds
      .map((id) => offeringMap.get(id))
      .filter((offering): offering is Offering => Boolean(offering));

    onSubmit({
      vehicleId: formState.vehicleId,
      packageId: formState.packageId ?? null,
      discountId: formState.discountId ?? null,
      startDate: formState.startDate,
      endDate: formState.endDate,
      pickupLocation: formState.pickupLocation,
      dropoffLocation: formState.dropoffLocation,
      insurancePolicy: formState.insurancePolicy,
      totalDays: formState.totalDays,
      totalRentalFee: formState.totalRentalFee,
      finalPrice: formState.finalPrice,
      balancePayment: formState.balancePayment,
      status: formState.status,
      offerings: selectedOfferings,
    });
  };

  const clearSelection = (field: 'packageId' | 'discountId') => {
    setFormState((prev) => ({
      ...prev,
      [field]: null,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reservation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <EntitySelect
                entityType="vehicle"
                value={formState.vehicleId ?? undefined}
                onChange={(id) => handleSelect('vehicleId')(id)}
              />
            </div>

            <div className="space-y-2">
              <Label>Package (Optional)</Label>
              <div className="flex items-center gap-2">
                <EntitySelect
                  entityType="package"
                  value={formState.packageId ?? undefined}
                  onChange={(id) => handleSelect('packageId')(id)}
                  className="flex-1"
                />
                {formState.packageId && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => clearSelection('packageId')}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Discount (Optional)</Label>
              <div className="flex items-center gap-2">
                <EntitySelect
                  entityType="discount"
                  value={formState.discountId ?? undefined}
                  onChange={(id) => handleSelect('discountId')(id)}
                  className="flex-1"
                />
                {formState.discountId && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => clearSelection('discountId')}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <DateTimePicker value={formState.startDate} onChange={handleDateChange('startDate')} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <DateTimePicker value={formState.endDate} onChange={handleDateChange('endDate')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logistics & Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickupLocation">Pickup Location *</Label>
              <Input
                id="pickupLocation"
                value={formState.pickupLocation}
                onChange={handleFieldChange('pickupLocation')}
                placeholder="e.g., Airport Terminal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropoffLocation">Dropoff Location *</Label>
              <Input
                id="dropoffLocation"
                value={formState.dropoffLocation}
                onChange={handleFieldChange('dropoffLocation')}
                placeholder="e.g., Downtown Office"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurancePolicy">Insurance Policy</Label>
              <Textarea
                id="insurancePolicy"
                value={formState.insurancePolicy}
                onChange={handleFieldChange('insurancePolicy')}
                placeholder="Describe coverage or policy details"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formState.status}
                onChange={(event) => {
                  setFormError(null);
                  const nextStatus = event.target.value as BookingStatus;
                  setFormState((prev) => ({
                    ...prev,
                    status: nextStatus,
                  }));
                }}
              >
                {Object.values(BookingStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalDays">Total Days</Label>
                <Input
                  id="totalDays"
                  type="number"
                  min={1}
                  step={1}
                  value={formState.totalDays}
                  onChange={handleNumericChange('totalDays', 'int')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalRentalFee">Total Rental Fee</Label>
                <Input
                  id="totalRentalFee"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formState.totalRentalFee}
                  onChange={handleNumericChange('totalRentalFee', 'float')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="finalPrice">Final Price</Label>
                <Input
                  id="finalPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formState.finalPrice}
                  onChange={handleNumericChange('finalPrice', 'float')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balancePayment">Balance Payment</Label>
                <Input
                  id="balancePayment"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formState.balancePayment}
                  onChange={handleNumericChange('balancePayment', 'float')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <OfferingMultiSelect
        offerings={offerings}
        selectedIds={selectedOfferingIds}
        onChange={setSelectedOfferingIds}
        isLoading={offeringsLoading}
        errorMessage={offeringsError instanceof Error ? offeringsError.message : undefined}
      />

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
