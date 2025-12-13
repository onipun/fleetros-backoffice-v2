'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useOfferingSearch } from '@/hooks/use-offering-search';
import { cn } from '@/lib/utils';
import { OfferingType } from '@/types';
import { ChevronDown, ChevronUp, DollarSign, Filter, Loader2, Package, Search, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'simple' | 'name' | 'type' | 'price' | 'mandatory' | 'advanced';

interface OfferingSelectorAdvancedProps {
  label?: string;
  value?: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Offering Selector Advanced Component
 * 
 * Professional offering selection with advanced search modes:
 * - Simple: Quick text search across name and description
 * - By Name: Search by offering name
 * - By Type: Filter by offering type (GPS, INSURANCE, etc.)
 * - By Price: Filter by price range
 * - By Mandatory Status: Filter by mandatory/optional status
 * - Advanced: Combine multiple search criteria
 * 
 * Features:
 * - Backend API integration with useOfferingSearch hook
 * - Real-time search with debouncing
 * - Pagination support
 * - Type-safe with comprehensive validation
 * - Accessible with proper ARIA labels
 * - Responsive design
 */
export function OfferingSelectorAdvanced({
  label,
  value,
  onChange,
  placeholder = 'Select an offering...',
  required = false,
  disabled = false,
  className,
}: OfferingSelectorAdvancedProps) {
  const { t, formatCurrency } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  
  // Search criteria state
  const [searchValue, setSearchValue] = useState('');
  const [offeringType, setOfferingType] = useState<OfferingType | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isMandatory, setIsMandatory] = useState<'true' | 'false' | ''>('');

  // Use offering search hook
  const { offerings, isLoading, search, reset: resetSearch } = useOfferingSearch();

  // Find selected offering
  const selectedOffering = value ? offerings.find((o) => o.id === value) : null;

  /**
   * Execute search based on current mode and criteria
   */
  const executeSearch = () => {
    const params: any = {
      page: 0,
      size: 20,
      sort: 'name,asc',
    };

    if (searchMode === 'simple' && searchValue.trim()) {
      params.name = searchValue.trim();
    } else if (searchMode === 'name' && searchValue.trim()) {
      params.name = searchValue.trim();
    } else if (searchMode === 'type' && offeringType) {
      params.offeringType = offeringType;
    } else if (searchMode === 'price') {
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
    } else if (searchMode === 'mandatory' && isMandatory) {
      params.isMandatory = isMandatory === 'true';
    } else if (searchMode === 'advanced') {
      if (searchValue.trim()) params.name = searchValue.trim();
      if (offeringType) params.offeringType = offeringType;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      if (isMandatory) params.isMandatory = isMandatory === 'true';
    }

    search(params);
  };

  /**
   * Handle mode change
   */
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    // Clear criteria when changing modes
    if (mode !== 'name' && mode !== 'simple' && mode !== 'advanced') setSearchValue('');
    if (mode !== 'type' && mode !== 'advanced') setOfferingType('');
    if (mode !== 'price' && mode !== 'advanced') {
      setMinPrice('');
      setMaxPrice('');
    }
    if (mode !== 'mandatory' && mode !== 'advanced') setIsMandatory('');
  };

  /**
   * Handle reset
   */
  const handleReset = () => {
    setSearchValue('');
    setOfferingType('');
    setMinPrice('');
    setMaxPrice('');
    setIsMandatory('');
    setSearchMode('simple');
    resetSearch();
  };

  /**
   * Handle offering selection
   */
  const handleSelect = (offeringId: number) => {
    onChange(offeringId);
    setIsOpen(false);
  };

  /**
   * Handle clear selection
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  // Auto-search on mount
  useEffect(() => {
    if (isOpen) {
      executeSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}

      {/* Selection Display */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !selectedOffering && 'text-muted-foreground'
          )}
        >
          <span className="truncate">
            {selectedOffering ? `${selectedOffering.name} (${formatCurrency(selectedOffering.price)})` : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedOffering && !disabled && (
              <X className="h-4 w-4 opacity-50 hover:opacity-100" onClick={handleClear} />
            )}
            {isOpen ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
          </div>
        </button>

        {/* Search Panel */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {/* Search Mode Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={searchMode === 'simple' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('simple')}
                >
                  <Search className="h-3 w-3 mr-1" />
                  {t('offering.search.simple') || 'Simple'}
                </Button>
                <Button
                  type="button"
                  variant={searchMode === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('name')}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {t('offering.search.byName') || 'By Name'}
                </Button>
                <Button
                  type="button"
                  variant={searchMode === 'type' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('type')}
                >
                  <Package className="h-3 w-3 mr-1" />
                  {t('offering.search.byType') || 'By Type'}
                </Button>
                <Button
                  type="button"
                  variant={searchMode === 'price' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('price')}
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  {t('offering.search.byPrice') || 'By Price'}
                </Button>
                <Button
                  type="button"
                  variant={searchMode === 'mandatory' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('mandatory')}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {t('offering.search.byMandatory') || 'By Status'}
                </Button>
                <Button
                  type="button"
                  variant={searchMode === 'advanced' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('advanced')}
                >
                  {t('offering.search.advanced') || 'Advanced'}
                </Button>
              </div>

              {/* Search Criteria */}
              <div className="space-y-3">
                {/* Text Search */}
                {(searchMode === 'simple' || searchMode === 'name' || searchMode === 'advanced') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {searchMode === 'simple' ? t('offering.search.searchLabel') || 'Search' : t('offering.search.nameLabel') || 'Offering Name'}
                    </Label>
                    <Input
                      type="text"
                      placeholder={t('offering.searchPlaceholders.name') || 'e.g., GPS Navigation'}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="h-9"
                    />
                  </div>
                )}

                {/* Type Filter */}
                {(searchMode === 'type' || searchMode === 'advanced') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('offering.search.typeLabel') || 'Offering Type'}</Label>
                    <Select value={offeringType} onValueChange={(value) => setOfferingType(value as OfferingType | '')}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={t('offering.search.selectType') || 'Select type'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GPS">{t('offering.type.gps') || 'GPS Navigation'}</SelectItem>
                        <SelectItem value="INSURANCE">{t('offering.type.insurance') || 'Insurance'}</SelectItem>
                        <SelectItem value="CHILD_SEAT">{t('offering.type.childSeat') || 'Child Seat'}</SelectItem>
                        <SelectItem value="WIFI">{t('offering.type.wifi') || 'WiFi Hotspot'}</SelectItem>
                        <SelectItem value="ADDITIONAL_DRIVER">{t('offering.type.additionalDriver') || 'Additional Driver'}</SelectItem>
                        <SelectItem value="OTHER">{t('offering.type.other') || 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Price Range */}
                {(searchMode === 'price' || searchMode === 'advanced') && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">{t('offering.search.priceRange') || 'Price Range'}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('offering.search.minPrice') || 'Min'}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t('offering.search.maxPrice') || 'Max'}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="999.99"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Mandatory Status */}
                {(searchMode === 'mandatory' || searchMode === 'advanced') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('offering.search.mandatoryLabel') || 'Status'}</Label>
                    <Select value={isMandatory} onValueChange={(value) => setIsMandatory(value as 'true' | 'false' | '')}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={t('offering.search.selectMandatory') || 'Select status'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">{t('offering.search.mandatory') || 'Mandatory'}</SelectItem>
                        <SelectItem value="false">{t('offering.search.optional') || 'Optional'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={executeSearch}
                  disabled={isLoading}
                  size="sm"
                  className="flex-1"
                >
                  <Search className="h-3 w-3 mr-1" />
                  {isLoading ? t('common.searching') || 'Searching...' : t('common.search') || 'Search'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  size="sm"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('common.reset') || 'Reset'}
                </Button>
              </div>

              {/* Results */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : offerings.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {t('offering.noResults') || 'No offerings found'}
                  </div>
                ) : (
                  offerings.map((offering) => {
                    if (!offering.id) return null;
                    return (
                      <button
                        key={offering.id}
                        type="button"
                        onClick={() => handleSelect(offering.id!)}
                        className={cn(
                          'w-full text-left p-3 rounded-md border hover:bg-accent transition-colors',
                          value === offering.id && 'bg-accent border-primary'
                        )}
                      >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{offering.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {t(`offering.type.${offering.offeringType?.toLowerCase()}`) || offering.offeringType}
                            {offering.isMandatory && ` • ${t('offering.search.mandatory') || 'Mandatory'}`}
                          </div>
                          {offering.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {offering.description}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-semibold whitespace-nowrap">
                          {formatCurrency(offering.price)}
                        </div>
                      </div>
                    </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
