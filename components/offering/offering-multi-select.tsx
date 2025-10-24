'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';
import type { Offering } from '@/types';
import { Loader2 } from 'lucide-react';
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

export function OfferingMultiSelect({
  title = 'Included Offerings',
  description = 'Select the optional offerings to bundle with this item.',
  offerings,
  selectedIds,
  onChange,
  isLoading = false,
  errorMessage,
  className,
}: OfferingMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

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

  const toggleOffering = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search offerings..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading offerings...
          </div>
        ) : errorMessage ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : filteredOfferings.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            {offerings.length === 0 ? 'No offerings available yet.' : 'No offerings match your search.'}
          </p>
        ) : (
          <div className="grid gap-3">
            {filteredOfferings.map((offering) => (
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
                    <span className="font-medium">{offering.name || 'Untitled Offering'}</span>
                    {offering.offeringType && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {offering.offeringType.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {offering.description && (
                    <p className="text-sm text-muted-foreground">{offering.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Price: {formatCurrency(offering.price ?? 0)}
                    {offering.maxQuantityPerBooking != null && (
                      <span className="ml-2">
                        Max qty per booking: {offering.maxQuantityPerBooking}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {selectedIds.length > 0 && !isLoading && (
          <div className="text-xs text-muted-foreground">
            {selectedIds.length} offering{selectedIds.length === 1 ? '' : 's'} selected
          </div>
        )}
      </CardContent>
    </Card>
  );
}
