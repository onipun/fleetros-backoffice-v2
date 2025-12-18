'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { OfferingType, type Offering } from '@/types';
import { AlertCircle, ChevronDown, ChevronUp, DollarSign, Filter, Loader2, Package, Search, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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

type SearchMode = 'simple' | 'name' | 'type' | 'price' | 'mandatory' | 'advanced';

export function BookingOfferingSelector({
  offerings: _passedOfferings,
  selections,
  onToggle,
  onQuantityChange,
  packageIncludedIds,
  mandatoryOfferingIds,
  isLoading: _passedIsLoading = false,
  errorMessage: _passedErrorMessage,
}: BookingOfferingSelectorProps) {
  const { t, formatCurrency } = useLocale();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  
  // Search criteria state
  const [searchValue, setSearchValue] = useState('');
  const [offeringType, setOfferingType] = useState<OfferingType | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isMandatory, setIsMandatory] = useState<'true' | 'false' | ''>('');

  // Use offering search hook for backend API integration
  const { offerings: searchedOfferings, isLoading: searchLoading, search, reset: resetSearch } = useOfferingSearch();

  // Use searched offerings if advanced mode is active, otherwise use passed offerings
  const offerings = showAdvanced ? searchedOfferings : _passedOfferings;
  const isLoading = showAdvanced ? searchLoading : _passedIsLoading;
  const errorMessage = showAdvanced ? undefined : _passedErrorMessage;

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

  // Simple client-side filtering for non-advanced mode
  const filteredOfferings = useMemo(() => {
    if (showAdvanced) return offerings;
    if (!searchValue.trim()) return offerings;
    const lowered = searchValue.toLowerCase();
    return offerings.filter((offering) => {
      const name = offering.name?.toLowerCase() ?? '';
      const description = offering.description?.toLowerCase() ?? '';
      const type = offering.offeringType?.toLowerCase() ?? '';
      return name.includes(lowered) || description.includes(lowered) || type.includes(lowered);
    });
  }, [offerings, searchValue, showAdvanced]);

  /**
   * Execute backend search
   */
  const executeSearch = () => {
    const params: any = {
      page: 0,
      size: 100,
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
    if (showAdvanced) {
      resetSearch();
    }
  };

  /**
   * Toggle advanced search mode
   */
  const toggleAdvanced = () => {
    const newShowAdvanced = !showAdvanced;
    setShowAdvanced(newShowAdvanced);
    if (newShowAdvanced) {
      // Switching to advanced: execute initial search
      executeSearch();
    } else {
      // Switching back to simple: reset search state
      handleReset();
    }
  };

  // Auto-execute search when advanced mode becomes active
  useEffect(() => {
    if (showAdvanced) {
      executeSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdvanced]);

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
        <div className="flex items-center justify-between">
          <Label htmlFor="offeringSearch">{t('booking.form.sections.offerings')}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleAdvanced}
            className="h-8 text-xs"
          >
            {showAdvanced ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                {t('offering.search.hideAdvanced') || 'Hide Advanced'}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                {t('offering.search.showAdvanced') || 'Show Advanced'}
              </>
            )}
          </Button>
        </div>

        {!showAdvanced ? (
          // Simple search mode
          <>
            <Input
              id="offeringSearch"
              placeholder={t('booking.form.offerings.searchPlaceholder')}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('booking.form.offerings.helper')}
            </p>
          </>
        ) : (
          // Advanced search mode
          <div className="border rounded-lg p-4 bg-card space-y-4">
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
                      <SelectItem value="HOMESTAY">{t('offering.type.homestay') || 'Homestay Accommodation'}</SelectItem>
                      <SelectItem value="VILLA">{t('offering.type.villa') || 'Villa Accommodation'}</SelectItem>
                      <SelectItem value="CHAUFFEUR">{t('offering.type.chauffeur') || 'Chauffeur Service'}</SelectItem>
                      <SelectItem value="AIRPORT_PICKUP">{t('offering.type.airportPickup') || 'Airport Pickup Service'}</SelectItem>
                      <SelectItem value="FULL_TANK">{t('offering.type.fullTank') || 'Full Tank Fuel'}</SelectItem>
                      <SelectItem value="TOLL_PASS">{t('offering.type.tollPass') || 'Toll Pass'}</SelectItem>
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
          </div>
        )}
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
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">
                          {`${t('booking.form.offerings.unitPriceLabel')}: ${formatCurrency(unitPrice)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {`Max quantity: ${offering.maxQuantityPerBooking}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex flex-col items-start gap-2 md:w-48">
                      <div className="space-y-1 w-full">
                        <Label className="text-xs text-muted-foreground">{t('booking.form.offerings.quantity')}</Label>
                        <Input
                          type="number"
                          min={selection?.included ? 1 : 1}
                          max={offering.maxQuantityPerBooking}
                          value={quantity}
                          onChange={(event) => {
                            const nextQuantity = Number.parseInt(event.target.value, 10);
                            const minQuantity = selection?.included ? 1 : 1;
                            const maxQuantity = offering.maxQuantityPerBooking;
                            const safeQuantity = Number.isNaN(nextQuantity)
                              ? minQuantity
                              : Math.max(minQuantity, Math.min(nextQuantity, maxQuantity));
                            onQuantityChange(id, safeQuantity);
                          }}
                        />
                        {selection?.included && (
                          <p className="text-xs text-muted-foreground">
                            {t('booking.form.offerings.packageHint')}
                          </p>
                        )}
                        {offering.maxQuantityPerBooking > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {`Max: ${offering.maxQuantityPerBooking}`}
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
