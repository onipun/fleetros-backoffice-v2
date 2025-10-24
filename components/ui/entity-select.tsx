'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import * as React from 'react';

export interface EntitySelectProps {
  entityType: 'vehicle' | 'package' | 'booking' | 'offering' | 'discount';
  value?: number;
  onChange?: (id: number, label: string) => void;
  className?: string;
}

const EntitySelect = React.forwardRef<HTMLButtonElement, EntitySelectProps>(
  ({ entityType, value, onChange, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Fetch entities from API
    const { data, isLoading } = useQuery({
      queryKey: [entityType, 'list'],
      queryFn: async () => {
        const resource = entityType === 'booking'
          ? 'bookings'
          : entityType === 'package'
            ? 'packages'
            : entityType === 'offering'
              ? 'offerings'
              : entityType === 'discount'
                ? 'discounts'
              : 'vehicles';

        const response = await hateoasClient.getCollection<any>(resource, { page: 0, size: 100 });
        // Extract items from _embedded
        if (!response._embedded) return [];
        const key = Object.keys(response._embedded)[0];
        return response._embedded[key] || [];
      },
    });

    // Get label for entity
    const getEntityLabel = (entity: any): string => {
      if (entityType === 'vehicle') {
        return `${entity.make} ${entity.model} ${entity.year} - ${entity.licensePlate}`;
      } else if (entityType === 'package') {
        return entity.name || `Package #${entity.id}`;
      } else if (entityType === 'booking') {
        return `Booking #${entity.id} - ${entity.pickupLocation}`;
      } else if (entityType === 'offering') {
        return entity.name || `Offering #${entity.id}`;
      } else if (entityType === 'discount') {
        return entity.code
          ? `${entity.code} (${entity.type ?? 'DISCOUNT'})`
          : `Discount #${entity.id}`;
      }
      return 'Unknown';
    };

    // Filter entities based on search
    const filteredEntities = React.useMemo(() => {
      if (!data) return [];
      if (!searchTerm) return data;
      
      return data.filter((entity: any) => {
        const label = getEntityLabel(entity).toLowerCase();
        return label.includes(searchTerm.toLowerCase());
      });
    }, [data, searchTerm, entityType]);

    // Get selected entity label
    const selectedLabel = React.useMemo(() => {
      if (!value || !data) return 'Select...';
      const entity = data.find((e: any) => e.id === value);
      return entity ? getEntityLabel(entity) : `ID: ${value}`;
    }, [value, data, entityType]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleSelect = (entity: any) => {
      onChange?.(entity.id, getEntityLabel(entity));
      setIsOpen(false);
      setSearchTerm('');
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
          ref={ref}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-lg">
            {/* Search Input */}
            <div className="border-b p-2">
              <Input
                placeholder={`Search ${entityType}s...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
                autoFocus
              />
            </div>

            {/* Options List */}
            <div className="max-h-[300px] overflow-y-auto p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No {entityType}s found
                </div>
              ) : (
                filteredEntities.map((entity: any) => (
                  <button
                    key={entity.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                      value === entity.id && 'bg-accent'
                    )}
                    onClick={() => handleSelect(entity)}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === entity.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="flex-1 truncate text-left">
                      {getEntityLabel(entity)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

EntitySelect.displayName = 'EntitySelect';

export { EntitySelect };
