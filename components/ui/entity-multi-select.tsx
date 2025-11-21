'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { parseHalResource } from '@/lib/utils';
import type { Offering, Package } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface EntityMultiSelectProps {
  entityType: 'package' | 'offering';
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  description?: string;
}

export function EntityMultiSelect({
  entityType,
  selectedIds,
  onChange,
  label,
  description,
}: EntityMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: [entityType === 'package' ? 'packages' : 'offerings', 'all'],
    queryFn: async () => {
      const endpoint = entityType === 'package' ? 'packages' : 'offerings';
      return hateoasClient.getCollection<Package | Offering>(endpoint, {
        page: 0,
        size: 100,
        sort: 'name,asc',
      });
    },
  });

  const entities = useMemo(() => {
    if (!data) return [];
    const key = entityType === 'package' ? 'packages' : 'offerings';
    return parseHalResource<Package | Offering>(data, key);
  }, [data, entityType]);

  const filteredEntities = useMemo(() => {
    if (!searchTerm) return entities;
    const lowerSearch = searchTerm.toLowerCase();
    return entities.filter((entity) => 
      entity.name?.toLowerCase().includes(lowerSearch) ||
      entity.description?.toLowerCase().includes(lowerSearch)
    );
  }, [entities, searchTerm]);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredEntities.map(e => e.id).filter((id): id is number => id !== undefined);
    onChange(allIds);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        Error loading {entityType}s: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={`Search ${entityType}s...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Select/Deselect All */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-primary hover:underline"
        >
          Select All ({filteredEntities.length})
        </button>
        <span className="text-sm text-muted-foreground">|</span>
        <button
          type="button"
          onClick={handleDeselectAll}
          className="text-sm text-primary hover:underline"
        >
          Deselect All
        </button>
      </div>

      {/* Selection Summary */}
      <div className="rounded-md bg-muted/50 p-3 text-sm">
        <strong>{selectedIds.length}</strong> {entityType}
        {selectedIds.length !== 1 ? 's' : ''} selected
      </div>

      {/* Entity List */}
      <div className="max-h-[400px] space-y-2 overflow-y-auto rounded-md border p-4">
        {filteredEntities.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No {entityType}s found
          </p>
        ) : (
          filteredEntities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`${entityType}-${entity.id}`}
                checked={selectedIds.includes(entity.id!)}
                onCheckedChange={() => handleToggle(entity.id!)}
              />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={`${entityType}-${entity.id}`}
                  className="cursor-pointer text-sm font-medium leading-none"
                >
                  {entity.name}
                </Label>
                {entity.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {entity.description}
                  </p>
                )}
                {'priceModifier' in entity && entity.priceModifier !== undefined && (
                  <p className="text-xs text-primary font-medium">
                    Modifier: {entity.priceModifier > 0 ? '+' : ''}
                    {entity.priceModifier}
                    {entity.modifierType === 'PERCENTAGE' ? '%' : ''}
                  </p>
                )}
                {'price' in entity && entity.price !== undefined && (
                  <p className="text-xs text-primary font-medium">
                    Price: ${entity.price.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
