'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OfferingRateType } from '@/types';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface OfferingPricingFormData {
  baseRate: number;
  rateType: OfferingRateType;
  priority: number;
  active: boolean;
  isDefault: boolean;
  minimumQuantity?: number;
  maximumQuantity?: number;
  neverExpires?: boolean;
  validFrom: string;
  validTo: string;
  description?: string;
}

interface OfferingMultiPricingPanelProps {
  onDataChange?: (pricings: OfferingPricingFormData[]) => void;
  entityInfo?: {
    type: string;
    id: string | number;
    name?: string;
  };
  /** If true, starts with one pricing entry expanded. Default is true for create forms. */
  startExpanded?: boolean;
}

export function OfferingMultiPricingPanel({
  onDataChange,
  entityInfo,
  startExpanded = true,
}: OfferingMultiPricingPanelProps) {
  const { t } = useLocale();
  const [pricings, setPricings] = useState<OfferingPricingFormData[]>(
    startExpanded ? [
    {
      baseRate: 0,
      rateType: OfferingRateType.DAILY,
      priority: 5,
      active: true,
      isDefault: true,
      minimumQuantity: undefined,
      maximumQuantity: undefined,
      neverExpires: false,
      validFrom: '',
      validTo: '',
      description: '',
    },
  ] : []
  );
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(
    startExpanded ? new Set([0]) : new Set()
  );

  const handleAddPricing = () => {
    const newPricing: OfferingPricingFormData = {
      baseRate: 0,
      rateType: OfferingRateType.DAILY,
      priority: 5,
      active: true,
      isDefault: false,
      minimumQuantity: undefined,
      maximumQuantity: undefined,
      neverExpires: false,
      validFrom: '',
      validTo: '',
      description: '',
    };

    const updatedPricings = [...pricings, newPricing];
    setPricings(updatedPricings);

    const newIndex = updatedPricings.length - 1;
    setExpandedIndexes(new Set([newIndex]));

    onDataChange?.(updatedPricings);
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleRemovePricing = (index: number) => {
    const updatedPricings = pricings.filter((_, i) => i !== index);

    if (pricings[index].isDefault && updatedPricings.length > 0) {
      updatedPricings[0].isDefault = true;
    }

    setPricings(updatedPricings);
    onDataChange?.(updatedPricings);
  };

  const handlePricingChange = (index: number, data: OfferingPricingFormData) => {
    const updatedPricings = [...pricings];

    // If this pricing is being set as default, unset all others
    if (data.isDefault && !pricings[index].isDefault) {
      updatedPricings.forEach((p, i) => {
        if (i !== index) {
          p.isDefault = false;
        }
      });
    }

    updatedPricings[index] = data;
    setPricings(updatedPricings);
    onDataChange?.(updatedPricings);
  };

  const isValidPricing = (pricing: OfferingPricingFormData): boolean => {
    return pricing.baseRate > 0 && (pricing.neverExpires || (pricing.validFrom !== '' && pricing.validTo !== ''));
  };

  const getValidPricingsCount = (): number => {
    return pricings.filter(isValidPricing).length;
  };

  const rateTypeOptions = [
    { value: OfferingRateType.DAILY, label: 'Daily' },
    { value: OfferingRateType.HOURLY, label: 'Hourly' },
    { value: OfferingRateType.FIXED, label: 'Fixed' },
    { value: OfferingRateType.PER_RENTAL, label: 'Per Rental' },
  ];

  // When no pricings, show only the add button
  if (pricings.length === 0) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddPricing}
          className="w-full"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Pricing Rule
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Offering Pricing Rules</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure multiple pricing rules based on dates, quantity, and priority
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{getValidPricingsCount()}</div>
              <div className="text-xs text-muted-foreground">Valid Rules</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {pricings.map((pricing, index) => {
        const isExpanded = expandedIndexes.has(index);

        return (
          <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleExpanded(index)}>
            <Card className="relative">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                        <CardTitle className="text-base">Pricing Rule #{index + 1}</CardTitle>
                      </div>
                      {pricing.isDefault && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                          Default
                        </span>
                      )}
                      {isValidPricing(pricing) && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                          Valid
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {pricings.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePricing(index);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* Rate Type and Base Rate */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`rateType-${index}`}>
                        Rate Type {t('common.required')}
                      </Label>
                      <select
                        id={`rateType-${index}`}
                        value={pricing.rateType}
                        onChange={(e) =>
                          handlePricingChange(index, {
                            ...pricing,
                            rateType: e.target.value as OfferingRateType,
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        {rateTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`baseRate-${index}`}>
                        Base Rate {t('common.required')}
                      </Label>
                      <CurrencyInput
                        id={`baseRate-${index}`}
                        value={pricing.baseRate}
                        onChange={(value) =>
                          handlePricingChange(index, { ...pricing, baseRate: value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Priority and Active/Default */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`priority-${index}`}>
                        Priority {t('common.required')}
                      </Label>
                      <Input
                        id={`priority-${index}`}
                        type="number"
                        min="1"
                        max="100"
                        value={pricing.priority}
                        onChange={(e) =>
                          handlePricingChange(index, {
                            ...pricing,
                            priority: parseInt(e.target.value) || 5,
                          })
                        }
                        placeholder="Higher = higher priority"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Higher values take precedence</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center space-x-2 h-10">
                        <Checkbox
                          id={`active-${index}`}
                          checked={pricing.active}
                          onCheckedChange={(checked) =>
                            handlePricingChange(index, { ...pricing, active: checked as boolean })
                          }
                        />
                        <Label htmlFor={`active-${index}`} className="cursor-pointer">
                          Active
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Default</Label>
                      <div className="flex items-center space-x-2 h-10">
                        <Checkbox
                          id={`isDefault-${index}`}
                          checked={pricing.isDefault}
                          onCheckedChange={(checked) =>
                            handlePricingChange(index, { ...pricing, isDefault: checked as boolean })
                          }
                        />
                        <Label htmlFor={`isDefault-${index}`} className="cursor-pointer">
                          Fallback
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Min/Max Quantity */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`minimumQuantity-${index}`}>Minimum Quantity</Label>
                      <Input
                        id={`minimumQuantity-${index}`}
                        type="number"
                        min="1"
                        value={pricing.minimumQuantity || ''}
                        onChange={(e) =>
                          handlePricingChange(index, {
                            ...pricing,
                            minimumQuantity: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        placeholder="Optional (e.g., 3 for bulk discount)"
                      />
                      <p className="text-xs text-muted-foreground">Leave empty for any quantity</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`maximumQuantity-${index}`}>Maximum Quantity</Label>
                      <Input
                        id={`maximumQuantity-${index}`}
                        type="number"
                        min="1"
                        value={pricing.maximumQuantity || ''}
                        onChange={(e) =>
                          handlePricingChange(index, {
                            ...pricing,
                            maximumQuantity: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        placeholder="Optional (e.g., 10 for tier limit)"
                      />
                      <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
                    </div>
                  </div>

                  {/* Never Expires */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`neverExpires-${index}`}
                      checked={Boolean(pricing.neverExpires)}
                      onCheckedChange={(checked) =>
                        handlePricingChange(index, {
                          ...pricing,
                          neverExpires: Boolean(checked),
                          validFrom: checked ? '' : pricing.validFrom,
                          validTo: checked ? '' : pricing.validTo,
                        })
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={`neverExpires-${index}`} className="cursor-pointer">
                        {t('pricing.form.neverExpires')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('pricing.form.neverExpiresHint')}
                      </p>
                    </div>
                  </div>

                  {/* Valid From/To */}
                  {!pricing.neverExpires && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`validFrom-${index}`}>
                          Valid From {t('common.required')}
                        </Label>
                        <DateTimePicker
                          id={`validFrom-${index}`}
                          value={pricing.validFrom}
                          onChange={(value) =>
                            handlePricingChange(index, { ...pricing, validFrom: value || '' })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`validTo-${index}`}>
                          Valid To {t('common.required')}
                        </Label>
                        <DateTimePicker
                          id={`validTo-${index}`}
                          value={pricing.validTo}
                          onChange={(value) =>
                            handlePricingChange(index, { ...pricing, validTo: value || '' })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={pricing.description}
                      onChange={(e) =>
                        handlePricingChange(index, { ...pricing, description: e.target.value })
                      }
                      placeholder="E.g., Weekend rate, Bulk discount for 3+ items, etc."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      <Button type="button" variant="outline" onClick={handleAddPricing} className="w-full" size="lg">
        <Plus className="mr-2 h-4 w-4" />
        Add Another Pricing Rule
      </Button>

      {pricings.length > 0 && getValidPricingsCount() === 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              No valid pricing rules yet. Please fill in base rate, valid from, and valid to dates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
