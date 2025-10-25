'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, formatCurrency } from '@/lib/utils';
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
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading offerings...
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
        <Label htmlFor="offeringSearch">Optional Offerings</Label>
        <Input
          id="offeringSearch"
          placeholder="Search offerings..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Add optional services and extras to this booking. Quantities can be adjusted after selecting an offering.
        </p>
      </div>

      {filteredOfferings.length === 0 ? (
        <p className="rounded-md border border-dashed border-muted px-4 py-6 text-sm text-muted-foreground">
          {offerings.length === 0 ? 'No offerings available yet.' : 'No offerings match your search.'}
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
                        <span className="font-medium">{offering.name || `Offering #${id}`}</span>
                        {isIncluded && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Included in package
                          </span>
                        )}
                        {offering.offeringType && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {offering.offeringType.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      {offering.description && (
                        <p className="text-sm text-muted-foreground">{offering.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Unit price: {formatCurrency(unitPrice)}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex flex-col items-start gap-2 md:w-48">
                      <div className="space-y-1 w-full">
                        <Label className="text-xs text-muted-foreground">Quantity</Label>
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
                            First unit covered by package. Extra units billed at standard rate.
                          </p>
                        )}
                      </div>
                      <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {billableQuantity > 0
                          ? `${billableQuantity} billable × ${formatCurrency(unitPrice)} = ${formatCurrency(lineTotal)}`
                          : 'No additional charge'}
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
                    Add offering
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
