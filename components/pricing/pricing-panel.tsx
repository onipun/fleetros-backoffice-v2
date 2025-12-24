'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PricingFormData } from '@/lib/validations/schemas';
import { DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

export type { PricingFormData } from '@/lib/validations/schemas';

interface PricingPanelProps {
  initialData?: PricingFormData;
  onDataChange?: (data: PricingFormData) => void;
  readOnly?: boolean;
  showValidity?: boolean;
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
    neverExpires: initialData?.neverExpires ?? false,
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
        neverExpires: initialData.neverExpires ?? false,
      };
      setFormData(nextData);
      // Don't call onDataChange here to avoid infinite loops
      // The parent already has this data as initialData
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
            <Label htmlFor="minimumRentalDays">{`${t('pricing.minimumRentalDays')} ${t('common.required')}`}</Label>
            <Input
              id="minimumRentalDays"
              type="number"
              min="0"
              value={formData.minimumRentalDays}
              onChange={(e) => handleChange({ minimumRentalDays: parseInt(e.target.value) || 0 })}
              disabled={readOnly}
              required
            />
            <p className="text-xs text-muted-foreground">{t('pricing.form.minimumRentalHint')}</p>
          </div>

          {showValidity && (
            <>
              {/* Never Expires Checkbox */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 p-3 rounded-md border border-dashed">
                  <Checkbox
                    id="neverExpires"
                    checked={Boolean(formData.neverExpires)}
                    onCheckedChange={(checked) => {
                      if (!readOnly) {
                        handleChange({ 
                          neverExpires: checked === true,
                          // Clear dates when never expires is checked
                          ...(checked === true ? { validFrom: '', validTo: '' } : {})
                        });
                      }
                    }}
                    disabled={readOnly}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="neverExpires" className="text-sm font-medium leading-none cursor-pointer">
                      {t('pricing.form.neverExpires')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('pricing.form.neverExpiresHint')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Range - Only show when neverExpires is false */}
              {!formData.neverExpires && (
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
            </>
          )}

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
                  Set as default <span className="font-bold">{selectedRateTypeLabel?.toLowerCase() || formData.rateType.toLowerCase()}</span> pricing
                </Label>
                <p className="text-xs text-muted-foreground">
                  Each vehicle can have one default <span className="font-semibold">{selectedRateTypeLabel?.toLowerCase() || formData.rateType.toLowerCase()}</span> pricing. Setting a new default overrides any existing one for overlapping dates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
