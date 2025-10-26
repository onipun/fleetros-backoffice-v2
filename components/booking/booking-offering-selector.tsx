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
  mandatoryOfferingIds: Set<number>;
  isLoading?: boolean;
  errorMessage?: string;
}

export function BookingOfferingSelector({
  offerings,
  selections,
  onToggle,
  onQuantityChange,
  packageIncludedIds,
  mandatoryOfferingIds,
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
    const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                          errorMessage.toLowerCase().includes('fetch') ||
                          errorMessage.toLowerCase().includes('connection');
    
    if (isNetworkError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-8 text-center">
          {/* Car with smoke animation - same car as loading but with smoke */}
          <div className="relative mb-4">
            {/* Smoke clouds */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="relative w-20 h-16">
                {/* Cloud 1 */}
                <div className="absolute left-2 top-0 w-10 h-10 bg-gray-400/60 rounded-full animate-smoke-1" />
                {/* Cloud 2 */}
                <div className="absolute left-6 top-3 w-8 h-8 bg-gray-400/40 rounded-full animate-smoke-2" />
                {/* Cloud 3 */}
                <div className="absolute left-10 top-1 w-9 h-9 bg-gray-400/50 rounded-full animate-smoke-3" />
              </div>
            </div>
            
            {/* Car SVG - same as page transition */}
            <svg
              className="w-[120px] h-[60px]"
              viewBox="0 0 120 60"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Car Shadow */}
              <ellipse
                cx="60"
                cy="55"
                rx="35"
                ry="3"
                fill="rgba(0,0,0,0.2)"
              />
              
              {/* Car Body */}
              <path
                d="M 30 40 L 20 40 Q 15 40 15 35 L 15 30 Q 15 25 20 25 L 35 25 L 40 15 Q 42 10 47 10 L 73 10 Q 78 10 80 15 L 85 25 L 100 25 Q 105 25 105 30 L 105 35 Q 105 40 100 40 L 90 40"
                fill="hsl(var(--destructive))"
                stroke="hsl(var(--destructive-foreground))"
                strokeWidth="1"
                opacity="0.9"
              />
              
              {/* Car Windows */}
              <path
                d="M 42 15 L 47 15 L 52 23 L 42 23 Z"
                fill="white"
                opacity="0.3"
              />
              <path
                d="M 68 15 L 73 15 L 78 23 L 68 23 Z"
                fill="white"
                opacity="0.3"
              />
              
              {/* Headlights - dimmed for error state */}
              <circle cx="18" cy="32" r="2" fill="#FFD700" opacity="0.3" />
              <circle cx="102" cy="32" r="2" fill="#FFD700" opacity="0.3" />
              
              {/* Wheels */}
              <g>
                <circle cx="30" cy="42" r="6" fill="hsl(var(--muted-foreground))" />
                <circle cx="30" cy="42" r="3" fill="hsl(var(--muted))" />
                <line x1="30" y1="39" x2="30" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                <line x1="27" y1="42" x2="33" y2="42" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
              </g>
              
              <g>
                <circle cx="90" cy="42" r="6" fill="hsl(var(--muted-foreground))" />
                <circle cx="90" cy="42" r="3" fill="hsl(var(--muted))" />
                <line x1="90" y1="39" x2="90" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                <line x1="87" y1="42" x2="93" y2="42" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
              </g>
            </svg>
          </div>
          
          <p className="text-sm font-medium text-destructive mb-1">Oops! Something Went Wrong</p>
          <p className="text-xs text-destructive/80">{errorMessage}</p>
        </div>
      );
    }
    
    // Non-network errors: show simple error message
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
            const isMandatory = mandatoryOfferingIds.has(id);
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
                        if (isIncluded || isMandatory) return;
                        onToggle(id, Boolean(checked));
                      }}
                      className="mt-1"
                      disabled={isIncluded || isMandatory}
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{fallbackName}</span>
                        {isMandatory && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            {t('offering.mandatory')}
                          </span>
                        )}
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

                {!isSelected && !isIncluded && !isMandatory && (
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
