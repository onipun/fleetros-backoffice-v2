'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { EntitySelect } from '@/components/ui/entity-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import type { DiscountScope, DiscountStatus, DiscountType } from '@/types';
import { DiscountStatus as DiscountStatusEnum, DiscountType as DiscountTypeEnum } from '@/types';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

export type DiscountFormState = {
  code: string;
  type: DiscountType;
  value: number;
  validFrom: string;
  validTo: string;
  minBookingAmount: number;
  maxUses: number;
  usesCount: number;
  applicableScope: DiscountScope;
  description: string;
  status: DiscountStatus;
  targetEntityId?: number;
};

interface DiscountFormProps {
  initialData?: Partial<DiscountFormState>;
  submitting?: boolean;
  submitLabel: string;
  onCancelHref: string;
  onSubmit: (values: DiscountFormState) => void;
}

const defaultValues: DiscountFormState = {
  code: '',
  type: DiscountTypeEnum.PERCENTAGE,
  value: 0,
  validFrom: '',
  validTo: '',
  minBookingAmount: 0,
  maxUses: 1,
  usesCount: 0,
  applicableScope: 'ALL',
  description: '',
  status: DiscountStatusEnum.ACTIVE,
  targetEntityId: undefined,
};

const scopeOptions: DiscountScope[] = ['ALL', 'PACKAGE', 'OFFERING', 'BOOKING'];

export function DiscountForm({
  initialData,
  submitting = false,
  submitLabel,
  onCancelHref,
  onSubmit,
}: DiscountFormProps) {
  const mergedInitial = useMemo(() => ({ ...defaultValues, ...initialData }), [initialData]);
  const [formState, setFormState] = useState<DiscountFormState>(mergedInitial);

  useEffect(() => {
    setFormState(mergedInitial);
  }, [mergedInitial]);

  const handleChange = (updates: Partial<DiscountFormState>) => {
    setFormState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleScopeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const scope = event.target.value as DiscountScope;
    handleChange({
      applicableScope: scope,
      targetEntityId: undefined,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.code.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Discount code is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formState.validFrom || !formState.validTo) {
      toast({
        title: 'Validation Error',
        description: 'Please select both valid from and valid to dates.',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formState.validFrom) >= new Date(formState.validTo)) {
      toast({
        title: 'Validation Error',
        description: 'Valid from date must be earlier than valid to date.',
        variant: 'destructive',
      });
      return;
    }

    if (formState.type === DiscountTypeEnum.PERCENTAGE) {
      if (formState.value <= 0 || formState.value > 100) {
        toast({
          title: 'Validation Error',
          description: 'Percentage discounts must be between 0 and 100.',
          variant: 'destructive',
        });
        return;
      }
    } else if (formState.value < 0) {
      toast({
        title: 'Validation Error',
        description: 'Discount value cannot be negative.',
        variant: 'destructive',
      });
      return;
    }

    if (formState.minBookingAmount < 0) {
      toast({
        title: 'Validation Error',
        description: 'Minimum booking amount cannot be negative.',
        variant: 'destructive',
      });
      return;
    }

    if (formState.maxUses < 1) {
      toast({
        title: 'Validation Error',
        description: 'Maximum uses must be at least 1.',
        variant: 'destructive',
      });
      return;
    }

    if ((formState.applicableScope === 'PACKAGE' || formState.applicableScope === 'OFFERING') && !formState.targetEntityId) {
      toast({
        title: 'Validation Error',
        description: `Please select a ${formState.applicableScope.toLowerCase()} to bind this discount to.`,
        variant: 'destructive',
      });
      return;
    }

    onSubmit(formState);
  };

  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as DiscountType;
    const adjustedValue = nextType === DiscountTypeEnum.PERCENTAGE ? Math.min(formState.value, 100) : formState.value;
    handleChange({ type: nextType, value: adjustedValue });
  };

  const renderValueField = () => {
    if (formState.type === DiscountTypeEnum.PERCENTAGE) {
      return (
        <div className="space-y-2">
          <Label htmlFor="value">Discount Percentage *</Label>
          <Input
            id="value"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formState.value}
            onChange={(event) => handleChange({ value: Number(event.target.value) || 0 })}
            required
          />
          <p className="text-xs text-muted-foreground">Enter the percentage discount (0-100%).</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor="value">Discount Amount (MYR) *</Label>
        <CurrencyInput id="value" value={formState.value} onChange={(value) => handleChange({ value })} required />
        <p className="text-xs text-muted-foreground">Fixed amount that will be deducted from the total.</p>
      </div>
    );
  };

  const renderTargetSelector = () => {
    if (formState.applicableScope === 'PACKAGE') {
      return (
        <div className="space-y-2">
          <Label>Select Package *</Label>
          <EntitySelect
            entityType="package"
            value={formState.targetEntityId}
            onChange={(id) => handleChange({ targetEntityId: id })}
          />
        </div>
      );
    }

    if (formState.applicableScope === 'OFFERING') {
      return (
        <div className="space-y-2">
          <Label>Select Offering *</Label>
          <EntitySelect
            entityType="offering"
            value={formState.targetEntityId}
            onChange={(id) => handleChange({ targetEntityId: id })}
          />
        </div>
      );
    }

    if (formState.applicableScope === 'BOOKING') {
      return (
        <p className="text-xs text-muted-foreground">
          This discount will be made available during booking without linking to a specific booking record.
        </p>
      );
    }

    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discount Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">Discount Code *</Label>
            <Input
              id="code"
              value={formState.code}
              onChange={(event) => handleChange({ code: event.target.value })}
              placeholder="e.g., SUMMER2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formState.status}
              onChange={(event) => handleChange({ status: event.target.value as DiscountStatus })}
              required
            >
              {Object.values(DiscountStatusEnum).map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Discount Type *</Label>
            <select
              id="type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formState.type}
              onChange={handleTypeChange}
              required
            >
              {Object.values(DiscountTypeEnum).map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {renderValueField()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Applicability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scope">Scope *</Label>
              <select
                id="scope"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formState.applicableScope}
                onChange={handleScopeChange}
                required
              >
                {scopeOptions.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope.charAt(0) + scope.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minBookingAmount">Minimum Booking Amount (MYR)</Label>
              <CurrencyInput
                id="minBookingAmount"
                value={formState.minBookingAmount}
                onChange={(value) => handleChange({ minBookingAmount: value })}
              />
            </div>
          </div>

          {renderTargetSelector()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxUses">Maximum Uses *</Label>
            <Input
              id="maxUses"
              type="number"
              min="1"
              value={formState.maxUses}
              onChange={(event) => handleChange({ maxUses: Number(event.target.value) || 1 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usesCount">Current Usage</Label>
            <Input id="usesCount" type="number" value={formState.usesCount} readOnly disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validity Window</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="validFrom">Valid From *</Label>
            <DateTimePicker
              id="validFrom"
              value={formState.validFrom}
              onChange={(value) => handleChange({ validFrom: value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="validTo">Valid To *</Label>
            <DateTimePicker id="validTo" value={formState.validTo} onChange={(value) => handleChange({ validTo: value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="description"
            value={formState.description}
            onChange={(event) => handleChange({ description: event.target.value })}
            placeholder="Describe this discount..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Link href={onCancelHref}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
