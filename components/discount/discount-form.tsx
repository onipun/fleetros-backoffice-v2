'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { EntityMultiSelect } from '@/components/ui/entity-multi-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import type { DiscountScope, DiscountStatus, DiscountType } from '@/types';
import { DiscountStatus as DiscountStatusEnum, DiscountType as DiscountTypeEnum } from '@/types';
import { AlertCircle, Info } from 'lucide-react';
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
  // New fields
  priority: number;
  autoApply: boolean;
  requiresPromoCode: boolean;
  combinableWithOtherDiscounts: boolean;
  firstTimeCustomerOnly: boolean;
  // Multi-select support
  selectedPackageIds: number[];
  selectedOfferingIds: number[];
  // Legacy field for backward compatibility
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
  priority: 10,
  autoApply: false,
  requiresPromoCode: true,
  combinableWithOtherDiscounts: true,
  firstTimeCustomerOnly: false,
  selectedPackageIds: [],
  selectedOfferingIds: [],
  targetEntityId: undefined,
};

const scopeOptions: DiscountScope[] = ['ALL', 'PACKAGE', 'OFFERING', 'BOOKING', 'VEHICLE'];

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
      selectedPackageIds: [],
      selectedOfferingIds: [],
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

    if (formState.applicableScope === 'PACKAGE' && formState.selectedPackageIds.length === 0) {
      showValidationError('discount.form.errors.packageRequired');
      return;
    }

    if (formState.applicableScope === 'OFFERING' && formState.selectedOfferingIds.length === 0) {
      showValidationError('discount.form.errors.offeringRequired');
      return;
    }

    if (formState.autoApply && formState.requiresPromoCode) {
      showValidationError('discount.form.errors.autoApplyConflict');
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
        <EntityMultiSelect
          entityType="package"
          selectedIds={formState.selectedPackageIds}
          onChange={(ids) => handleChange({ selectedPackageIds: ids })}
          label={`${t('discount.form.selectPackagesLabel')} ${t('common.required')}`}
          description={t('discount.form.selectPackagesDescription')}
        />
      );
    }

    if (formState.applicableScope === 'OFFERING') {
      return (
        <EntityMultiSelect
          entityType="offering"
          selectedIds={formState.selectedOfferingIds}
          onChange={(ids) => handleChange({ selectedOfferingIds: ids })}
          label={`${t('discount.form.selectOfferingsLabel')} ${t('common.required')}`}
          description={t('discount.form.selectOfferingsDescription')}
        />
      );
    }

    if (formState.applicableScope === 'BOOKING') {
      return (
        <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-900">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">{t('discount.form.bookingScopeHint')}</p>
        </div>
      );
    }

    if (formState.applicableScope === 'VEHICLE') {
      return (
        <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-900">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">{t('discount.form.vehicleScopeHint')}</p>
        </div>
      );
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

      <Card>
        <CardHeader>
          <CardTitle>{t('discount.form.advancedTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('discount.form.advancedDescription')}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">{t('discount.form.priorityLabel')}</Label>
            <Input
              id="priority"
              type="number"
              min="0"
              value={formState.priority}
              onChange={(event) => handleChange({ priority: Number(event.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">{t('discount.form.priorityHelper')}</p>
          </div>

          {/* Auto-Apply */}
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id="autoApply"
              checked={formState.autoApply}
              onCheckedChange={(checked) => handleChange({ autoApply: checked === true })}
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="autoApply"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {t('discount.form.autoApplyLabel')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('discount.form.autoApplyDescription')}
              </p>
            </div>
          </div>

          {/* Requires Promo Code */}
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id="requiresPromoCode"
              checked={formState.requiresPromoCode}
              onCheckedChange={(checked) => handleChange({ requiresPromoCode: checked === true })}
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="requiresPromoCode"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {t('discount.form.requiresPromoCodeLabel')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('discount.form.requiresPromoCodeDescription')}
              </p>
              {formState.autoApply && formState.requiresPromoCode && (
                <div className="flex items-start gap-2 mt-2 rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 dark:text-amber-100">
                    {t('discount.form.autoApplyConflictWarning')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Combinable With Other Discounts */}
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id="combinableWithOtherDiscounts"
              checked={formState.combinableWithOtherDiscounts}
              onCheckedChange={(checked) => handleChange({ combinableWithOtherDiscounts: checked === true })}
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="combinableWithOtherDiscounts"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {t('discount.form.combinableLabel')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('discount.form.combinableDescription')}
              </p>
            </div>
          </div>

          {/* First Time Customer Only */}
          <div className="flex items-start space-x-3 rounded-lg border p-4">
            <Checkbox
              id="firstTimeCustomerOnly"
              checked={formState.firstTimeCustomerOnly}
              onCheckedChange={(checked) => handleChange({ firstTimeCustomerOnly: checked === true })}
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="firstTimeCustomerOnly"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {t('discount.form.firstTimeOnlyLabel')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('discount.form.firstTimeOnlyDescription')}
              </p>
            </div>
          </div>
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
