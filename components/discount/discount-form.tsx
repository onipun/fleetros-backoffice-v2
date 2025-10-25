'use client';

import { useLocale } from '@/components/providers/locale-provider';
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
  const { t } = useLocale();
  const mergedInitial = useMemo(() => ({ ...defaultValues, ...initialData }), [initialData]);
  const [formState, setFormState] = useState<DiscountFormState>(mergedInitial);

  const statusOptions = useMemo(
    () =>
      Object.values(DiscountStatusEnum).map((status) => ({
        value: status,
        label: t(`discount.status.${status.toLowerCase()}`),
      })),
    [t],
  );

  const typeOptions = useMemo(
    () =>
      Object.values(DiscountTypeEnum).map((type) => ({
        value: type,
        label: t(`discount.type.${type.toLowerCase()}`),
      })),
    [t],
  );

  const scopeOptionEntries = useMemo(
    () =>
      scopeOptions.map((scope) => ({
        value: scope,
        label: t(`discount.scope.${scope.toLowerCase()}`),
      })),
    [t],
  );

  const showValidationError = (messageKey: string) => {
    toast({
      title: t('discount.form.validationErrorTitle'),
      description: t(messageKey),
      variant: 'destructive',
    });
  };

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
      showValidationError('discount.form.errors.codeRequired');
      return;
    }

    if (!formState.validFrom || !formState.validTo) {
      showValidationError('discount.form.errors.validRangeRequired');
      return;
    }

    if (new Date(formState.validFrom) >= new Date(formState.validTo)) {
      showValidationError('discount.form.errors.validRangeOrder');
      return;
    }

    if (formState.type === DiscountTypeEnum.PERCENTAGE) {
      if (formState.value <= 0 || formState.value > 100) {
        showValidationError('discount.form.errors.percentageRange');
        return;
      }
    } else if (formState.value < 0) {
      showValidationError('discount.form.errors.amountNegative');
      return;
    }

    if (formState.minBookingAmount < 0) {
      showValidationError('discount.form.errors.minBookingNegative');
      return;
    }

    if (formState.maxUses < 1) {
      showValidationError('discount.form.errors.maxUsesMinimum');
      return;
    }

    if ((formState.applicableScope === 'PACKAGE' || formState.applicableScope === 'OFFERING') && !formState.targetEntityId) {
      showValidationError(
        formState.applicableScope === 'PACKAGE'
          ? 'discount.form.errors.packageRequired'
          : 'discount.form.errors.offeringRequired',
      );
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
          <Label htmlFor="value">
            {t('discount.form.percentageLabel')} {t('common.required')}
          </Label>
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
          <p className="text-xs text-muted-foreground">{t('discount.form.percentageHelper')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor="value">
          {t('discount.form.amountLabel')} {t('common.required')}
        </Label>
        <CurrencyInput id="value" value={formState.value} onChange={(value) => handleChange({ value })} required />
        <p className="text-xs text-muted-foreground">{t('discount.form.amountHelper')}</p>
      </div>
    );
  };

  const renderTargetSelector = () => {
    if (formState.applicableScope === 'PACKAGE') {
      return (
        <div className="space-y-2">
          <Label>
            {t('discount.form.selectPackageLabel')} {t('common.required')}
          </Label>
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
          <Label>
            {t('discount.form.selectOfferingLabel')} {t('common.required')}
          </Label>
          <EntitySelect
            entityType="offering"
            value={formState.targetEntityId}
            onChange={(id) => handleChange({ targetEntityId: id })}
          />
        </div>
      );
    }

    if (formState.applicableScope === 'BOOKING') {
      return <p className="text-xs text-muted-foreground">{t('discount.form.bookingScopeHint')}</p>;
    }

    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('discount.form.detailsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">
              {t('discount.form.codeLabel')} {t('common.required')}
            </Label>
            <Input
              id="code"
              value={formState.code}
              onChange={(event) => handleChange({ code: event.target.value })}
              placeholder={t('discount.form.codePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              {t('discount.form.statusLabel')} {t('common.required')}
            </Label>
            <select
              id="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formState.status}
              onChange={(event) => handleChange({ status: event.target.value as DiscountStatus })}
              required
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              {t('discount.form.typeLabel')} {t('common.required')}
            </Label>
            <select
              id="type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formState.type}
              onChange={handleTypeChange}
              required
            >
              {typeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {renderValueField()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('discount.form.applicabilityTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scope">
                {t('discount.form.scopeLabel')} {t('common.required')}
              </Label>
              <select
                id="scope"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formState.applicableScope}
                onChange={handleScopeChange}
                required
              >
                {scopeOptionEntries.map((scope) => (
                  <option key={scope.value} value={scope.value}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minBookingAmount">{t('discount.form.minBookingAmountLabel')}</Label>
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
          <CardTitle>{t('discount.form.usageTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxUses">
              {t('discount.form.maxUsesLabel')} {t('common.required')}
            </Label>
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
            <Label htmlFor="usesCount">{t('discount.form.usesCountLabel')}</Label>
            <Input id="usesCount" type="number" value={formState.usesCount} readOnly disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('discount.form.validityTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="validFrom">
              {t('discount.form.validFromLabel')} {t('common.required')}
            </Label>
            <DateTimePicker
              id="validFrom"
              value={formState.validFrom}
              onChange={(value) => handleChange({ validFrom: value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="validTo">
              {t('discount.form.validToLabel')} {t('common.required')}
            </Label>
            <DateTimePicker id="validTo" value={formState.validTo} onChange={(value) => handleChange({ validTo: value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('discount.form.descriptionTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="description"
            value={formState.description}
            onChange={(event) => handleChange({ description: event.target.value })}
            placeholder={t('discount.form.descriptionPlaceholder')}
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Link href={onCancelHref}>
          <Button type="button" variant="outline">
            {t('common.cancel')}
          </Button>
        </Link>
        <Button type="submit" disabled={submitting}>
          {submitting ? t('common.saving') : submitLabel}
        </Button>
      </div>
    </form>
  );
}
