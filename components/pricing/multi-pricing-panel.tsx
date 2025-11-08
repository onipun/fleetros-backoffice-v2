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
}

export function MultiPricingPanel({
  onDataChange,
  existingTags = [],
  entityInfo,
}: MultiPricingPanelProps) {
  const { t } = useLocale();
  const [pricings, setPricings] = useState<PricingFormData[]>([
    {
      baseRate: 0,
      rateType: 'Daily',
      depositAmount: 0,
      minimumRentalDays: 1,
      validFrom: '',
      validTo: '',
      tags: [],
      isDefault: true,
    },
  ]);
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(new Set([0])); // First one expanded by default

  const handleAddPricing = () => {
    const newPricing: PricingFormData = {
      baseRate: 0,
      rateType: 'Daily',
      depositAmount: 0,
      minimumRentalDays: 1,
      validFrom: '',
      validTo: '',
      tags: [],
      isDefault: false,
    };
    
    const updatedPricings = [...pricings, newPricing];
    setPricings(updatedPricings);
    
    // Collapse all existing entries and expand only the new one
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
    
    // If we removed the default pricing and there are still pricings left,
    // make the first one default
    if (pricings[index].isDefault && updatedPricings.length > 0) {
      updatedPricings[0].isDefault = true;
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

  const isValidPricing = (pricing: PricingFormData): boolean => {
    return (
      pricing.baseRate > 0 &&
      pricing.validFrom !== '' &&
      pricing.validTo !== ''
    );
  };

  const getValidPricingsCount = (): number => {
    return pricings.filter(isValidPricing).length;
  };

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
                          {t('pricing.defaultPricing')}
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
