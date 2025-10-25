'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Offering } from '@/types';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface BookingOfferingSelection {
  offering: Offering;
  quantity: number;
  included: boolean;
}

interface BookingOfferingSelectorProps {
  offerings: Offering[];
  selections: Record<number, BookingOfferingSelection>;
  onToggle: (offeringId: number, selected: boolean) => void;
  onQuantityChange: (offeringId: number, quantity: number) => void;
  packageIncludedIds: Set<number>;
  isLoading?: boolean;
  errorMessage?: string;
}

export function BookingOfferingSelector({
  offerings,
  selections,
  onToggle,
  onQuantityChange,
  packageIncludedIds,
  isLoading = false,
  errorMessage,
}: BookingOfferingSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { t, formatCurrency } = useLocale();
  const typeLabelMap = useMemo(
    () => ({
      GPS: t('offering.types.gps'),
      INSURANCE: t('offering.types.insurance'),
      CHILD_SEAT: t('offering.types.childSeat'),
      WIFI: t('offering.types.wifi'),
      ADDITIONAL_DRIVER: t('offering.types.additionalDriver'),
      OTHER: t('offering.types.other'),
    }),
    [t]
  );

  const filteredOfferings = useMemo(() => {
    if (!searchTerm.trim()) return offerings;
    const lowered = searchTerm.toLowerCase();
    return offerings.filter((offering) => {
      const name = offering.name?.toLowerCase() ?? '';
      const description = offering.description?.toLowerCase() ?? '';
      const type = offering.offeringType?.toLowerCase() ?? '';
      return name.includes(lowered) || description.includes(lowered) || type.includes(lowered);
    });
  }, [offerings, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed border-muted p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('booking.form.offerings.loading')}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="offeringSearch">{t('booking.form.sections.offerings')}</Label>
        <Input
          id="offeringSearch"
          placeholder={t('booking.form.offerings.searchPlaceholder')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t('booking.form.offerings.helper')}
        </p>
      </div>

      {filteredOfferings.length === 0 ? (
        <p className="rounded-md border border-dashed border-muted px-4 py-6 text-sm text-muted-foreground">
          {offerings.length === 0
            ? t('booking.form.offerings.empty')
            : t('booking.form.offerings.noResults')}
        </p>
      ) : (
        <div className="grid gap-3">
          {filteredOfferings.map((offering) => {
            const id = offering.id;
            if (id == null) return null;

            const selection = selections[id];
            const isIncluded = packageIncludedIds.has(id);
            const isSelected = Boolean(selection);
            const quantity = selection?.quantity ?? (isIncluded ? 1 : 0);
            const unitPrice = offering.price ?? 0;
            const includedQuantity = selection?.included ? 1 : 0;
            const billableQuantity = Math.max(0, quantity - includedQuantity);
            const lineTotal = billableQuantity * unitPrice;
            const fallbackName = offering.name || `${t('offering.unnamedOffering')} #${id}`;
            const typeLabel = offering.offeringType ? typeLabelMap[offering.offeringType] : undefined;

            return (
              <div
                key={id}
                className={cn(
                  'rounded-md border p-3 transition-colors',
                  isSelected ? 'border-primary bg-primary/5' : 'border-muted'
                )}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (isIncluded) return;
                        onToggle(id, Boolean(checked));
                      }}
                      className="mt-1"
                      disabled={isIncluded}
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{fallbackName}</span>
                        {isIncluded && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {t('booking.form.offerings.packageBadge')}
                          </span>
                        )}
                        {typeLabel && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {typeLabel}
                          </span>
                        )}
                      </div>
                      {offering.description && (
                        <p className="text-sm text-muted-foreground">{offering.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {`${t('booking.form.offerings.unitPriceLabel')}: ${formatCurrency(unitPrice)}`}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex flex-col items-start gap-2 md:w-48">
                      <div className="space-y-1 w-full">
                        <Label className="text-xs text-muted-foreground">{t('booking.form.offerings.quantity')}</Label>
                        <Input
                          type="number"
                          min={selection?.included ? 1 : 1}
                          value={quantity}
                          onChange={(event) => {
                            const nextQuantity = Number.parseInt(event.target.value, 10);
                            const safeQuantity = Number.isNaN(nextQuantity)
                              ? (selection?.included ? 1 : 1)
                              : Math.max(nextQuantity, selection?.included ? 1 : 1);
                            onQuantityChange(id, safeQuantity);
                          }}
                        />
                        {selection?.included && (
                          <p className="text-xs text-muted-foreground">
                            {t('booking.form.offerings.packageHint')}
                          </p>
                        )}
                      </div>
                      <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {billableQuantity > 0
                          ? `${billableQuantity} ${t('booking.form.offerings.billableLabel')} × ${formatCurrency(unitPrice)} = ${formatCurrency(lineTotal)}`
                          : t('booking.form.offerings.noCharge')}
                      </div>
                    </div>
                  )}
                </div>

                {!isSelected && !isIncluded && (
                  <button
                    type="button"
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                    onClick={() => onToggle(id, true)}
                  >
                    {t('booking.form.offerings.addAction')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
