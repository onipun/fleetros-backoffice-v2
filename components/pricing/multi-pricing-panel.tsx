'use client';

import { PricingPanel, type PricingFormData } from '@/components/pricing/pricing-panel';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface MultiPricingPanelProps {
  onDataChange?: (pricings: PricingFormData[]) => void;
  existingTags?: string[];
  entityInfo?: {
    type: string;
    id: string | number;
    name?: string;
  };
  /** If true, starts with one pricing entry expanded. Default is true for create forms. */
  startExpanded?: boolean;
}

const getInitialPricing = (): PricingFormData => ({
  baseRate: 0,
  rateType: 'Daily',
  depositAmount: 0,
  minimumRentalDays: 1,
  validFrom: '',
  validTo: '',
  tags: [],
  isDefault: true,
});

export function MultiPricingPanel({
  onDataChange,
  existingTags = [],
  entityInfo,
  startExpanded = true,
}: MultiPricingPanelProps) {
  const { t } = useLocale();
  const [pricings, setPricings] = useState<PricingFormData[]>(
    startExpanded ? [getInitialPricing()] : []
  );
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(
    startExpanded ? new Set([0]) : new Set()
  );

  const handleAddPricing = () => {
    const newPricing: PricingFormData = {
      baseRate: 0,
      rateType: 'Daily',
      depositAmount: 0,
      minimumRentalDays: 1,
      validFrom: '',
      validTo: '',
      tags: [],
      isDefault: pricings.length === 0, // First pricing is default
    };
    
    const newIndex = pricings.length;
    const updatedPricings = [...pricings, newPricing];
    setPricings(updatedPricings);
    
    // Auto-expand the new pricing
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
    const removedPricing = pricings[index];
    const updatedPricings = pricings.filter((_, i) => i !== index);
    
    // If we removed a default pricing, find another pricing with the same rateType to make default
    if (removedPricing.isDefault && updatedPricings.length > 0) {
      const sameRateTypePricing = updatedPricings.find(p => p.rateType === removedPricing.rateType);
      if (sameRateTypePricing) {
        sameRateTypePricing.isDefault = true;
      }
    }
    
    setPricings(updatedPricings);
    onDataChange?.(updatedPricings);
  };

  const handlePricingChange = (index: number, data: PricingFormData) => {
    const updatedPricings = [...pricings];
    const previousData = pricings[index];
    
    // Auto-inherit deposit from base rate if base rate changed and deposit hasn't been manually set
    if (data.baseRate !== previousData.baseRate) {
      // If deposit is 0 or equals the old base rate, update it to match new base rate
      if (previousData.depositAmount === 0 || previousData.depositAmount === previousData.baseRate) {
        data.depositAmount = data.baseRate;
      }
    }
    
    // If this pricing is being set as default, unset others with the same rateType only
    if (data.isDefault && !pricings[index].isDefault) {
      updatedPricings.forEach((p, i) => {
        if (i !== index && p.rateType === data.rateType) {
          p.isDefault = false;
        }
      });
    }
    
    // If rateType changed and this is default, check if there's already a default for the new rateType
    if (data.rateType !== previousData.rateType && data.isDefault) {
      updatedPricings.forEach((p, i) => {
        if (i !== index && p.rateType === data.rateType && p.isDefault) {
          p.isDefault = false;
        }
      });
    }
    
    updatedPricings[index] = data;
    setPricings(updatedPricings);
    onDataChange?.(updatedPricings);
  };

  const isValidPricing = (pricing: PricingFormData): boolean => {
    // Pricing is valid if it has a base rate > 0 AND either:
    // - neverExpires is true, OR
    // - both validFrom and validTo are set
    return (
      pricing.baseRate > 0 &&
      (pricing.neverExpires || (pricing.validFrom !== '' && pricing.validTo !== ''))
    );
  };

  const getValidPricingsCount = (): number => {
    return pricings.filter(isValidPricing).length;
  };

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
          {t('pricing.multiPricing.addPricing')}
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
              <CardTitle className="text-lg">{t('pricing.multiPricing.title')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('pricing.multiPricing.description')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{getValidPricingsCount()}</div>
              <div className="text-xs text-muted-foreground">{t('pricing.multiPricing.validPricings')}</div>
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
                        <CardTitle className="text-base">
                          {t('pricing.multiPricing.pricingEntry')} #{index + 1}
                        </CardTitle>
                      </div>
                      {pricing.isDefault && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                          Default {pricing.rateType}
                        </span>
                      )}
                      {isValidPricing(pricing) && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                          {t('pricing.multiPricing.valid')}
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
                <CardContent className="pt-0">
                  <PricingPanel
                    initialData={pricing}
                    onDataChange={(data) => handlePricingChange(index, data)}
                    showValidity={true}
                    existingTags={existingTags}
                    entityInfo={entityInfo}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={handleAddPricing}
        className="w-full"
        size="lg"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('pricing.multiPricing.addAnother')}
      </Button>

      {pricings.length > 0 && getValidPricingsCount() === 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t('pricing.multiPricing.noValidPricingsWarning')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
