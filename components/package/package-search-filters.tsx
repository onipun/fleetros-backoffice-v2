'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { type PackageSearchParams } from '@/lib/api/package-search';
import { PackageModifierType } from '@/types';
import { Calendar, DollarSign, Filter, Package as PackageIcon, Percent, Search, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'all' | 'name' | 'type' | 'modifier' | 'valid' | 'discount' | 'advanced';

/**
 * Props for PackageSearchFilters component
 */
interface PackageSearchFiltersProps {
  onSearch: (params: PackageSearchParams) => void;
  isLoading?: boolean;
}

/**
 * Package Search Filters Component
 * 
 * Professional, compact search interface for packages with multiple search modes:
 * - All Packages: List all packages with pagination
 * - By Name: Search by package name
 * - By Type: Filter by modifier type (FIXED/PERCENTAGE)
 * - By Modifier: Filter by price modifier range
 * - Valid Now: Find currently valid packages
 * - By Discount: Filter by discount allowance
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
export function PackageSearchFilters({ onSearch, isLoading = false }: PackageSearchFiltersProps) {
  const { t } = useLocale();

  // Search mode state
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  // Search criteria state
  const [searchValue, setSearchValue] = useState('');
  const [modifierType, setModifierType] = useState<PackageModifierType | ''>('');
  const [minModifier, setMinModifier] = useState('');
  const [maxModifier, setMaxModifier] = useState('');
  const [allowDiscountOnModifier, setAllowDiscountOnModifier] = useState<'true' | 'false' | ''>('');
  const [minRentalDays, setMinRentalDays] = useState('');
  const [validDate, setValidDate] = useState('');

  // Pagination and sorting state
  const [pageSize, setPageSize] = useState('20');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  /**
   * Handle search submission
   */
  const handleSearch = () => {
    const params: PackageSearchParams = {
      page: 0,
      size: parseInt(pageSize) || 20,
      sort: `${sortField},${sortDirection}`,
    };

    // Add search criteria based on mode
    if (searchMode === 'name' && searchValue.trim()) {
      params.name = searchValue.trim();
    } else if (searchMode === 'type' && modifierType) {
      params.modifierType = modifierType;
    } else if (searchMode === 'modifier') {
      if (minModifier) params.minModifier = parseFloat(minModifier);
      if (maxModifier) params.maxModifier = parseFloat(maxModifier);
    } else if (searchMode === 'valid') {
      params.validDate = validDate || new Date().toISOString();
    } else if (searchMode === 'discount' && allowDiscountOnModifier) {
      params.allowDiscountOnModifier = allowDiscountOnModifier === 'true';
    } else if (searchMode === 'advanced') {
      // Advanced mode: combine all criteria
      if (searchValue.trim()) params.name = searchValue.trim();
      if (modifierType) params.modifierType = modifierType;
      if (minModifier) params.minModifier = parseFloat(minModifier);
      if (maxModifier) params.maxModifier = parseFloat(maxModifier);
      if (allowDiscountOnModifier) params.allowDiscountOnModifier = allowDiscountOnModifier === 'true';
      if (minRentalDays) params.minRentalDays = parseInt(minRentalDays);
      if (validDate) params.validDate = validDate;
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
    if (mode !== 'type' && mode !== 'advanced') setModifierType('');
    if (mode !== 'modifier' && mode !== 'advanced') {
      setMinModifier('');
      setMaxModifier('');
    }
    if (mode !== 'discount' && mode !== 'advanced') setAllowDiscountOnModifier('');
    if (mode !== 'valid' && mode !== 'advanced') setValidDate('');
    if (mode !== 'advanced') setMinRentalDays('');
  };

  /**
   * Handle reset
   */
  const handleReset = () => {
    setSearchValue('');
    setModifierType('');
    setMinModifier('');
    setMaxModifier('');
    setAllowDiscountOnModifier('');
    setMinRentalDays('');
    setValidDate('');
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
    if (searchMode === 'type') return modifierType !== '';
    if (searchMode === 'modifier') return minModifier || maxModifier;
    if (searchMode === 'valid') return true;
    if (searchMode === 'discount') return allowDiscountOnModifier !== '';
    if (searchMode === 'advanced') {
      return searchValue.trim().length > 0 || modifierType !== '' || 
             minModifier || maxModifier || allowDiscountOnModifier !== '' ||
             minRentalDays || validDate;
    }
    return false;
  };

  /**
   * Get placeholder text based on search mode
   */
  const getPlaceholder = () => {
    if (searchMode === 'name') return t('package.search.namePlaceholder') || 'e.g., Weekend Special';
    if (searchMode === 'advanced') return t('package.search.searchPlaceholder') || 'Search by name...';
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
            {t('package.search.allPackages') || 'All Packages'}
          </Button>
          <Button
            variant={searchMode === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('name')}
            disabled={isLoading}
            className="h-9"
          >
            <Search className="h-4 w-4 mr-1.5" />
            {t('package.search.byName') || 'By Name'}
          </Button>
          <Button
            variant={searchMode === 'type' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('type')}
            disabled={isLoading}
            className="h-9"
          >
            <PackageIcon className="h-4 w-4 mr-1.5" />
            {t('package.search.byType') || 'By Type'}
          </Button>
          <Button
            variant={searchMode === 'modifier' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('modifier')}
            disabled={isLoading}
            className="h-9"
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            {t('package.search.byModifier') || 'By Modifier'}
          </Button>
          <Button
            variant={searchMode === 'valid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('valid')}
            disabled={isLoading}
            className="h-9"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            {t('package.search.validNow') || 'Valid Now'}
          </Button>
          <Button
            variant={searchMode === 'discount' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('discount')}
            disabled={isLoading}
            className="h-9"
          >
            <Percent className="h-4 w-4 mr-1.5" />
            {t('package.search.byDiscount') || 'By Discount'}
          </Button>
          <Button
            variant={searchMode === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('advanced')}
            disabled={isLoading}
            className="h-9"
          >
            {t('package.search.advanced') || 'Advanced'}
          </Button>
        </div>

        {/* Search Filters - Dynamic based on mode */}
        <div className="flex flex-col gap-4">
          {/* Text Search Input */}
          {(searchMode === 'name' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="searchValue" className="text-sm font-medium">
                  {searchMode === 'name' && (t('package.search.nameLabel') || 'Package Name')}
                  {searchMode === 'advanced' && (t('package.search.searchLabel') || 'Search')}
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
                  {searchMode === 'name' && (t('package.search.nameHint') || 'Search by package name (partial match)')}
                  {searchMode === 'advanced' && (t('package.search.searchHint') || 'Search by name (optional)')}
                </p>
              </div>
            </div>
          )}

          {/* Modifier Type Filter */}
          {(searchMode === 'type' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="modifierType" className="text-sm font-medium">
                  {t('package.search.typeLabel') || 'Modifier Type'}
                </Label>
                <Select
                  value={modifierType}
                  onValueChange={(value) => setModifierType(value as PackageModifierType | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="modifierType" className="h-10">
                    <SelectValue placeholder={t('package.search.selectType') || 'Select type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">{t('package.type.percentage') || 'Percentage'}</SelectItem>
                    <SelectItem value="FIXED">{t('package.type.fixed') || 'Fixed Amount'}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('package.search.typeHint') || 'Filter by modifier type'}
                </p>
              </div>
            </div>
          )}

          {/* Price Modifier Range Filters */}
          {(searchMode === 'modifier' || searchMode === 'advanced') && (
            <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
              <Label className="text-sm font-semibold">{t('package.search.modifierRange') || 'Price Modifier Range'}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minModifier" className="text-xs font-medium text-muted-foreground">
                    {t('package.search.minModifier') || 'Minimum Modifier'}
                  </Label>
                  <Input
                    id="minModifier"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 0.80 (20% off)"
                    value={minModifier}
                    onChange={(e) => setMinModifier(e.target.value)}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxModifier" className="text-xs font-medium text-muted-foreground">
                    {t('package.search.maxModifier') || 'Maximum Modifier'}
                  </Label>
                  <Input
                    id="maxModifier"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 0.95 (5% off)"
                    value={maxModifier}
                    onChange={(e) => setMaxModifier(e.target.value)}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('package.search.modifierHint') || 'For percentage: 0.80 = 20% off, for fixed: actual amount'}
              </p>
            </div>
          )}

          {/* Valid Date Filter */}
          {(searchMode === 'valid' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="validDate" className="text-sm font-medium">
                  {t('package.search.validDateLabel') || 'Valid Date'}
                </Label>
                <DateTimePicker
                  value={validDate}
                  onChange={(value) => setValidDate(value)}
                  disabled={isLoading}
                  showTimeSelect={true}
                />
                <p className="text-xs text-muted-foreground">
                  {t('package.search.validDateHint') || 'Leave empty to check current date'}
                </p>
              </div>
            </div>
          )}

          {/* Discount Allowance Filter */}
          {(searchMode === 'discount' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="allowDiscountOnModifier" className="text-sm font-medium">
                  {t('package.search.discountLabel') || 'Allow Additional Discounts'}
                </Label>
                <Select
                  value={allowDiscountOnModifier}
                  onValueChange={(value) => setAllowDiscountOnModifier(value as 'true' | 'false' | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="allowDiscountOnModifier" className="h-10">
                    <SelectValue placeholder={t('package.search.selectDiscount') || 'Select discount allowance'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t('package.search.allowsDiscount') || 'Allows Discounts'}</SelectItem>
                    <SelectItem value="false">{t('package.search.noDiscount') || 'No Discounts'}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('package.search.discountHint') || 'Filter by whether discount codes can be applied'}
                </p>
              </div>
            </div>
          )}

          {/* Minimum Rental Days - Advanced Only */}
          {searchMode === 'advanced' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="minRentalDays" className="text-sm font-medium">
                  {t('package.search.minRentalDaysLabel') || 'Max Minimum Rental Days'}
                </Label>
                <Input
                  id="minRentalDays"
                  type="number"
                  min="1"
                  placeholder="e.g., 3"
                  value={minRentalDays}
                  onChange={(e) => setMinRentalDays(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('package.search.minRentalDaysHint') || 'Find packages requiring this many days or less'}
                </p>
              </div>
            </div>
          )}

          {/* Pagination and Sort Controls */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-sm font-semibold mb-3 block">
              {t('package.search.pagination') || 'Pagination & Sort'}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Page Size */}
              <div className="space-y-1.5">
                <Label htmlFor="pageSize" className="text-sm font-medium">
                  {t('package.search.pageSize') || 'Page Size'}
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
                  {t('package.search.sortBy') || 'Sort By'}
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
                    <SelectItem value="name">{t('package.search.sortName') || 'Name'}</SelectItem>
                    <SelectItem value="priceModifier">{t('package.search.sortModifier') || 'Price Modifier'}</SelectItem>
                    <SelectItem value="modifierType">{t('package.search.sortType') || 'Type'}</SelectItem>
                    <SelectItem value="minRentalDays">{t('package.search.sortMinDays') || 'Min Rental Days'}</SelectItem>
                    <SelectItem value="validFrom">{t('package.search.sortValidFrom') || 'Valid From'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Direction */}
              <div className="space-y-1.5">
                <Label htmlFor="sortDirection" className="text-sm font-medium">
                  {t('package.search.sortDirection') || 'Direction'}
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
                    <SelectItem value="asc">{t('package.search.ascending') || 'Ascending'}</SelectItem>
                    <SelectItem value="desc">{t('package.search.descending') || 'Descending'}</SelectItem>
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
              {isLoading ? (t('package.search.searching') || 'Searching...') : (t('package.search.search') || 'Search')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="h-10 px-6"
            >
              <X className="h-4 w-4 mr-2" />
              {t('package.search.reset') || 'Reset'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageSearchFilters;
