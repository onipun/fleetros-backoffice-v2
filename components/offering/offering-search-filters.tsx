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
import { type OfferingSearchParams } from '@/lib/api/offering-search';
import { OfferingType } from '@/types';
import { DollarSign, Filter, Package, Search, Tag, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'all' | 'name' | 'type' | 'price' | 'mandatory' | 'advanced';

/**
 * Props for OfferingSearchFilters component
 */
interface OfferingSearchFiltersProps {
  onSearch: (params: OfferingSearchParams) => void;
  isLoading?: boolean;
}

/**
 * Offering Search Filters Component
 * 
 * Professional, compact search interface for offerings with multiple search modes:
 * - All Offerings: List all offerings with pagination
 * - By Name: Search by offering name
 * - By Type: Filter by offering type (GPS, INSURANCE, etc.)
 * - By Price: Filter by price range
 * - By Mandatory: Filter by mandatory/optional status
 * - Advanced: Combine multiple criteria
 * 
 * Enterprise-grade implementation with:
 * - SOLID principles (Single Responsibility, Open/Closed, Interface Segregation)
 * - KISS approach (Keep It Simple, Stupid)
 * - Professional, compact UI/UX
 * - Type-safe with comprehensive validation
 * - Accessible with proper ARIA labels
 * - Responsive design with mobile-first approach
 */
export function OfferingSearchFilters({ onSearch, isLoading = false }: OfferingSearchFiltersProps) {
  const { t } = useLocale();

  // Search mode state
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  // Search criteria state
  const [searchValue, setSearchValue] = useState('');
  const [offeringType, setOfferingType] = useState<OfferingType | ''>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isMandatory, setIsMandatory] = useState<'true' | 'false' | ''>('');

  // Pagination and sorting state
  const [pageSize, setPageSize] = useState('20');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  /**
   * Handle search submission
   */
  const handleSearch = () => {
    const params: OfferingSearchParams = {
      page: 0,
      size: parseInt(pageSize) || 20,
      sort: `${sortField},${sortDirection}`,
    };

    // Add search criteria based on mode
    if (searchMode === 'name' && searchValue.trim()) {
      params.name = searchValue.trim();
    } else if (searchMode === 'type' && offeringType) {
      params.offeringType = offeringType;
    } else if (searchMode === 'price') {
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
    } else if (searchMode === 'mandatory' && isMandatory) {
      params.isMandatory = isMandatory === 'true';
    } else if (searchMode === 'advanced') {
      // Advanced mode: combine all criteria
      if (searchValue.trim()) params.name = searchValue.trim();
      if (offeringType) params.offeringType = offeringType;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      if (isMandatory) params.isMandatory = isMandatory === 'true';
    }

    onSearch(params);
  };

  /**
   * Handle search mode change
   */
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    // Clear relevant filters when changing modes
    if (mode !== 'name' && mode !== 'advanced') setSearchValue('');
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
    setPageSize('20');
    setSortField('name');
    setSortDirection('asc');
    setSearchMode('all');
    onSearch({ page: 0, size: 20, sort: 'name,asc' });
  };

  /**
   * Check if search can be executed
   */
  const canSearch = () => {
    if (searchMode === 'all') return true;
    if (searchMode === 'name') return searchValue.trim().length > 0;
    if (searchMode === 'type') return offeringType !== '';
    if (searchMode === 'price') return minPrice || maxPrice;
    if (searchMode === 'mandatory') return isMandatory !== '';
    if (searchMode === 'advanced') {
      return searchValue.trim().length > 0 || offeringType !== '' || 
             minPrice || maxPrice || isMandatory !== '';
    }
    return false;
  };

  /**
   * Get placeholder text based on search mode
   */
  const getPlaceholder = () => {
    if (searchMode === 'name') return t('offering.search.namePlaceholder') || 'e.g., GPS Navigation';
    if (searchMode === 'advanced') return t('offering.search.searchPlaceholder') || 'Search by name...';
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-card shadow-sm">
        {/* Search Mode Selector */}
        <div className="flex flex-wrap gap-2 pb-3 border-b">
          <Button
            variant={searchMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('all')}
            disabled={isLoading}
            className="h-9"
          >
            <Filter className="h-4 w-4 mr-1.5" />
            {t('offering.search.allOfferings') || 'All Offerings'}
          </Button>
          <Button
            variant={searchMode === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('name')}
            disabled={isLoading}
            className="h-9"
          >
            <Search className="h-4 w-4 mr-1.5" />
            {t('offering.search.byName') || 'By Name'}
          </Button>
          <Button
            variant={searchMode === 'type' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('type')}
            disabled={isLoading}
            className="h-9"
          >
            <Package className="h-4 w-4 mr-1.5" />
            {t('offering.search.byType') || 'By Type'}
          </Button>
          <Button
            variant={searchMode === 'price' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('price')}
            disabled={isLoading}
            className="h-9"
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            {t('offering.search.byPrice') || 'By Price'}
          </Button>
          <Button
            variant={searchMode === 'mandatory' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('mandatory')}
            disabled={isLoading}
            className="h-9"
          >
            <Tag className="h-4 w-4 mr-1.5" />
            {t('offering.search.byMandatory') || 'By Status'}
          </Button>
          <Button
            variant={searchMode === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('advanced')}
            disabled={isLoading}
            className="h-9"
          >
            {t('offering.search.advanced') || 'Advanced'}
          </Button>
        </div>

        {/* Search Filters - Dynamic based on mode */}
        <div className="flex flex-col gap-4">
          {/* Text Search Input */}
          {(searchMode === 'name' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="searchValue" className="text-sm font-medium">
                  {searchMode === 'name' && (t('offering.search.nameLabel') || 'Offering Name')}
                  {searchMode === 'advanced' && (t('offering.search.searchLabel') || 'Search')}
                </Label>
                <Input
                  id="searchValue"
                  type="text"
                  placeholder={getPlaceholder()}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {searchMode === 'name' && (t('offering.search.nameHint') || 'Search by offering name (partial match)')}
                  {searchMode === 'advanced' && (t('offering.search.searchHint') || 'Search by name (optional)')}
                </p>
              </div>
            </div>
          )}

          {/* Offering Type Filter */}
          {(searchMode === 'type' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="offeringType" className="text-sm font-medium">
                  {t('offering.search.typeLabel') || 'Offering Type'}
                </Label>
                <Select
                  value={offeringType}
                  onValueChange={(value) => setOfferingType(value as OfferingType | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="offeringType" className="h-10">
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
                <p className="text-xs text-muted-foreground">
                  {t('offering.search.typeHint') || 'Filter by offering type'}
                </p>
              </div>
            </div>
          )}

          {/* Price Range Filters */}
          {(searchMode === 'price' || searchMode === 'advanced') && (
            <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
              <Label className="text-sm font-semibold">{t('offering.search.priceRange') || 'Price Range'}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minPrice" className="text-xs font-medium text-muted-foreground">
                    {t('offering.search.minPrice') || 'Minimum Price'}
                  </Label>
                  <Input
                    id="minPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 10.00"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxPrice" className="text-xs font-medium text-muted-foreground">
                    {t('offering.search.maxPrice') || 'Maximum Price'}
                  </Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 100.00"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('offering.search.priceHint') || 'Filter offerings within price range'}
              </p>
            </div>
          )}

          {/* Mandatory Status Filter */}
          {(searchMode === 'mandatory' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="isMandatory" className="text-sm font-medium">
                  {t('offering.search.mandatoryLabel') || 'Mandatory Status'}
                </Label>
                <Select
                  value={isMandatory}
                  onValueChange={(value) => setIsMandatory(value as 'true' | 'false' | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="isMandatory" className="h-10">
                    <SelectValue placeholder={t('offering.search.selectMandatory') || 'Select status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t('offering.search.mandatory') || 'Mandatory'}</SelectItem>
                    <SelectItem value="false">{t('offering.search.optional') || 'Optional'}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('offering.search.mandatoryHint') || 'Filter by mandatory or optional status'}
                </p>
              </div>
            </div>
          )}

          {/* Pagination and Sort Controls */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-sm font-semibold mb-3 block">
              {t('offering.search.pagination') || 'Pagination & Sort'}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Page Size */}
              <div className="space-y-1.5">
                <Label htmlFor="pageSize" className="text-sm font-medium">
                  {t('offering.search.pageSize') || 'Page Size'}
                </Label>
                <Select
                  value={pageSize}
                  onValueChange={setPageSize}
                  disabled={isLoading}
                >
                  <SelectTrigger id="pageSize" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Field */}
              <div className="space-y-1.5">
                <Label htmlFor="sortField" className="text-sm font-medium">
                  {t('offering.search.sortBy') || 'Sort By'}
                </Label>
                <Select
                  value={sortField}
                  onValueChange={setSortField}
                  disabled={isLoading}
                >
                  <SelectTrigger id="sortField" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">{t('offering.search.sortName') || 'Name'}</SelectItem>
                    <SelectItem value="offeringType">{t('offering.search.sortType') || 'Type'}</SelectItem>
                    <SelectItem value="price">{t('offering.search.sortPrice') || 'Price'}</SelectItem>
                    <SelectItem value="availability">{t('offering.search.sortAvailability') || 'Availability'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Direction */}
              <div className="space-y-1.5">
                <Label htmlFor="sortDirection" className="text-sm font-medium">
                  {t('offering.search.sortDirection') || 'Direction'}
                </Label>
                <Select
                  value={sortDirection}
                  onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="sortDirection" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t('offering.search.ascending') || 'Ascending'}</SelectItem>
                    <SelectItem value="desc">{t('offering.search.descending') || 'Descending'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSearch}
              disabled={!canSearch() || isLoading}
              className="h-10 px-6"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? (t('offering.search.searching') || 'Searching...') : (t('offering.search.search') || 'Search')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="h-10 px-6"
            >
              <X className="h-4 w-4 mr-2" />
              {t('offering.search.reset') || 'Reset'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfferingSearchFilters;
