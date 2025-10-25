'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';
import type { PricingFormData } from '@/lib/validations/schemas';
import { DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

export type { PricingFormData } from '@/lib/validations/schemas';

interface PricingPanelProps {
  initialData?: PricingFormData;
  onDataChange?: (data: PricingFormData) => void;
  readOnly?: boolean;
  showValidity?: boolean;
  existingTags?: string[]; // Tags from previous pricing entries
  entityInfo?: {
    type: string; // e.g., "Vehicle", "Package", "Offering"
    id: string | number;
    name?: string;
  };
}

export function PricingPanel({
  initialData,
  onDataChange,
  readOnly = false,
  showValidity = true,
  existingTags = [],
  entityInfo,
}: PricingPanelProps) {
  const { t, formatCurrency } = useLocale();
  const [formData, setFormData] = useState<PricingFormData>({
    baseRate: initialData?.baseRate ?? 0,
    rateType: initialData?.rateType ?? 'Daily',
    depositAmount: initialData?.depositAmount ?? 0,
    minimumRentalDays: initialData?.minimumRentalDays ?? 1,
    validFrom: initialData?.validFrom ?? '',
    validTo: initialData?.validTo ?? '',
    tags: initialData?.tags ?? [],
    isDefault: initialData?.isDefault ?? false,
  });

  useEffect(() => {
    if (initialData) {
      const nextData: PricingFormData = {
        baseRate: initialData.baseRate ?? 0,
        rateType: initialData.rateType ?? 'Daily',
        depositAmount: initialData.depositAmount ?? 0,
        minimumRentalDays: initialData.minimumRentalDays ?? 1,
        validFrom: initialData.validFrom ?? '',
        validTo: initialData.validTo ?? '',
        tags: initialData.tags ?? [],
        isDefault: initialData.isDefault ?? false,
      };
      setFormData(nextData);
      onDataChange?.(nextData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleChange = (updates: Partial<PricingFormData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onDataChange?.(newData);
  };

  const rateTypeOptions = [
    { value: 'Hourly', label: t('pricing.rateTypes.hourly') },
    { value: 'Daily', label: t('pricing.rateTypes.daily') },
    { value: 'Weekly', label: t('pricing.rateTypes.weekly') },
    { value: 'Monthly', label: t('pricing.rateTypes.monthly') },
    { value: 'Flat', label: t('pricing.rateTypes.flat') },
  ];

  const selectedRateTypeLabel = rateTypeOptions.find((option) => option.value === formData.rateType)?.label;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <CardTitle>{t('pricing.form.configurationTitle')}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{t('pricing.form.configurationDescription')}</p>
        {entityInfo && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">{t('pricing.form.connectedTo')}</span>
              <span className="font-semibold">{entityInfo.type}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">
                {entityInfo.name || `ID: ${entityInfo.id}`}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rateType">{`${t('pricing.rateType')} ${t('common.required')}`}</Label>
            <select
              id="rateType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.rateType}
              onChange={(e) => handleChange({ rateType: e.target.value })}
              disabled={readOnly}
              required
            >
              {rateTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t('pricing.form.rateTypeHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseRate">{`${t('pricing.baseRate')} ${t('common.required')}`}</Label>
            <CurrencyInput
              id="baseRate"
              value={formData.baseRate}
              onChange={(value) => handleChange({ baseRate: value })}
              disabled={readOnly}
              required
            />
            <p className="text-xs text-muted-foreground">{t('pricing.form.baseRateHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositAmount">{`${t('pricing.depositAmount')} ${t('common.required')}`}</Label>
            <CurrencyInput
              id="depositAmount"
              value={formData.depositAmount}
              onChange={(value) => handleChange({ depositAmount: value })}
              disabled={readOnly}
              required
            />
            <p className="text-xs text-muted-foreground">{t('pricing.form.depositHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimumRentalDays">{`${t('pricing.minimumRentalDays')} ${t('common.required')}`}</Label>
            <Input
              id="minimumRentalDays"
              type="number"
              min="1"
              value={formData.minimumRentalDays}
              onChange={(e) => handleChange({ minimumRentalDays: parseInt(e.target.value) || 1 })}
              disabled={readOnly}
              required
            />
            <p className="text-xs text-muted-foreground">{t('pricing.form.minimumRentalHint')}</p>
          </div>

          {showValidity && (
            <>
              <div className="space-y-2">
                <Label htmlFor="validFrom">{`${t('pricing.validFrom')} ${t('common.required')}`}</Label>
                <DateTimePicker
                  id="validFrom"
                  value={formData.validFrom}
                  onChange={(value) => handleChange({ validFrom: value })}
                  disabled={readOnly}
                />
                <p className="text-xs text-muted-foreground">{t('pricing.form.validFromHint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">{`${t('pricing.validTo')} ${t('common.required')}`}</Label>
                <DateTimePicker
                  id="validTo"
                  value={formData.validTo}
                  onChange={(value) => handleChange({ validTo: value })}
                  disabled={readOnly}
                />
                <p className="text-xs text-muted-foreground">{t('pricing.form.validToHint')}</p>
              </div>
            </>
          )}

          {/* Tags Input */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tags">{`${t('pricing.tags')} (${t('common.optional')})`}</Label>
            <TagInput
              value={formData.tags || []}
              onChange={(tags) => handleChange({ tags })}
              placeholder={t('pricing.addTagsPlaceholder')}
              suggestions={existingTags}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">{t('pricing.form.tagsSuggestion')}</p>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
              <Checkbox
                id="isDefault"
                checked={Boolean(formData.isDefault)}
                onCheckedChange={(checked) =>
                  !readOnly && handleChange({ isDefault: checked === true })
                }
                disabled={readOnly}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor="isDefault" className="text-sm font-medium leading-none">
                  {t('pricing.form.defaultLabel')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('pricing.form.defaultHelper')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="text-sm font-medium mb-2">{t('pricing.form.summaryTitle')}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pricing.rateType')}:</span>
              <span className="font-medium">{selectedRateTypeLabel ?? formData.rateType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pricing.baseRate')}:</span>
              <span className="font-medium">{formatCurrency(formData.baseRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pricing.depositAmount')}:</span>
              <span className="font-medium">{formatCurrency(formData.depositAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pricing.minimumRentalDays')}:</span>
              <span className="font-medium">{formData.minimumRentalDays}</span>
            </div>
            {showValidity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('pricing.form.validity')}:</span>
                <span className="font-medium">
                  {formData.validFrom && formData.validTo
                    ? `${new Date(formData.validFrom).toLocaleDateString()} - ${new Date(formData.validTo).toLocaleDateString()}`
                    : t('pricing.form.validityNotSet')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pricing.tags')}:</span>
              <span className="font-medium">
                {formData.tags?.length ? formData.tags.join(', ') : t('pricing.form.noTags')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('pricing.form.defaultLabel')}:</span>
              <span className="font-medium">
                {formData.isDefault ? t('pricing.form.defaultSummaryOn') : t('pricing.form.defaultSummaryOff')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
