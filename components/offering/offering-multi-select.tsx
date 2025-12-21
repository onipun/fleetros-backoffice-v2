'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';
import type { Offering } from '@/types';
import { ChevronDown, ChevronUp, Filter, Loader2, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface OfferingMultiSelectProps {
  title?: string;
  description?: string;
  offerings: Offering[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  isLoading?: boolean;
  errorMessage?: string;
  className?: string;
}

const offeringTypeKeyMap: Record<string, string> = {
  GPS: 'gps',
  INSURANCE: 'insurance',
  CHILD_SEAT: 'childSeat',
  WIFI: 'wifi',
  ADDITIONAL_DRIVER: 'additionalDriver',
  OTHER: 'other',
};

export function OfferingMultiSelect({
  title,
  description,
  offerings,
  selectedIds,
  onChange,
  isLoading = false,
  errorMessage,
  className,
}: OfferingMultiSelectProps) {
  const { t } = useLocale();
  const resolvedTitle = title ?? t('package.includedOfferings');
  const resolvedDescription = description ?? t('offering.selector.description');
  const searchPlaceholder = t('offering.selector.searchPlaceholder');
  const loadingLabel = t('offering.selector.loading');
  const emptyLabel = t('offering.selector.empty');
  const noResultsLabel = t('offering.selector.noResults');
  const untitledLabel = t('offering.selector.untitled');
  const selectedSingular = t('offering.selector.selectedSingular');
  const selectedPlural = t('offering.selector.selectedPlural');

  const [searchTerm, setSearchTerm] = useState('');
  const [isOtherOfferingsExpanded, setIsOtherOfferingsExpanded] = useState(false);

  const filteredOfferings = useMemo(() => {
    if (!searchTerm) return offerings;
    const term = searchTerm.toLowerCase();
    return offerings.filter((offering) => {
      const name = offering.name?.toLowerCase() || '';
      const description = offering.description?.toLowerCase() || '';
      const type = offering.offeringType?.toLowerCase() || '';
      return name.includes(term) || description.includes(term) || type.includes(term);
    });
  }, [offerings, searchTerm]);

  // Separate offerings into selected and unselected
  const { selectedOfferings, unselectedOfferings } = useMemo(() => {
    const selected: Offering[] = [];
    const unselected: Offering[] = [];
    
    filteredOfferings.forEach((offering) => {
      if (offering.id != null && selectedIds.includes(offering.id)) {
        selected.push(offering);
      } else {
        unselected.push(offering);
      }
    });
    
    return { selectedOfferings: selected, unselectedOfferings: unselected };
  }, [filteredOfferings, selectedIds]);

  // Determine if search is active
  const isSearchActive = searchTerm.trim().length > 0;

  const toggleOffering = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const resolveOfferingType = (type?: Offering['offeringType']) => {
    if (!type) {
      return undefined;
    }
    const key = offeringTypeKeyMap[type];
    return key ? t(`offering.types.${key}`) : type.replace(/_/g, ' ');
  };

  const resolveSelectedLabel = (count: number) => {
    const template = count === 1 ? selectedSingular : selectedPlural;
    return template.replace('{count}', String(count));
  };

  // Render offering card
  const renderOfferingCard = (offering: Offering) => (
    <label
      key={offering.id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:border-primary/50',
        selectedIds.includes(offering.id ?? -1) && 'border-primary bg-primary/5'
      )}
    >
      <Checkbox
        checked={selectedIds.includes(offering.id ?? -1)}
        onCheckedChange={() => offering.id != null && toggleOffering(offering.id)}
        className="mt-0.5"
      />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{offering.name || untitledLabel}</span>
          {offering.offeringType && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {resolveOfferingType(offering.offeringType)}
            </span>
          )}
        </div>
        {offering.description && (
          <p className="text-sm text-muted-foreground">{offering.description}</p>
        )}
        <div className="text-xs text-muted-foreground">
          {t('offering.priceLabel')} {formatCurrency(offering.price ?? 0)}
          {offering.maxQuantityPerBooking != null && (
            <span className="ml-2">
              {t('offering.maxQuantityLabel')} {offering.maxQuantityPerBooking} {t('offering.perBookingSuffix')}
            </span>
          )}
        </div>
      </div>
    </label>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{resolvedTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{resolvedDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingLabel}
          </div>
        ) : errorMessage ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : filteredOfferings.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            {offerings.length === 0 ? emptyLabel : noResultsLabel}
          </p>
        ) : isSearchActive ? (
          // When search is active, show all filtered results in a flat list
          <div className="grid gap-3">
            {filteredOfferings.map(renderOfferingCard)}
          </div>
        ) : (
          // Default view: show selected offerings first, then collapsible section for unselected
          <div className="space-y-4">
            {/* Selected offerings (always visible) */}
            {selectedOfferings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t('offering.selector.selectedOfferings') || 'Selected Offerings'}
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {selectedOfferings.length}
                  </span>
                </h4>
                <div className="grid gap-3">
                  {selectedOfferings.map(renderOfferingCard)}
                </div>
              </div>
            )}

            {/* Unselected offerings (collapsible) */}
            {unselectedOfferings.length > 0 && (
              <Collapsible open={isOtherOfferingsExpanded} onOpenChange={setIsOtherOfferingsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      {t('offering.selector.browseMore') || 'Browse More Offerings'}
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {unselectedOfferings.length}
                      </span>
                    </span>
                    {isOtherOfferingsExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="grid gap-3">
                    {unselectedOfferings.map(renderOfferingCard)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Empty state when no offerings at all */}
            {selectedOfferings.length === 0 && unselectedOfferings.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">{emptyLabel}</p>
            )}
          </div>
        )}

        {selectedIds.length > 0 && !isLoading && (
          <div className="text-xs text-muted-foreground">
            {resolveSelectedLabel(selectedIds.length)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
