/**
 * Discount Search Filters Component
 * 
 * Professional, compact search interface for discounts with multiple search modes:
 * - All Discounts: List all discounts with pagination
 * - By Code: Search by discount code
 * - By Type: Filter by discount type (PERCENTAGE/FIXED_AMOUNT)
 * - By Status: Filter by status (ACTIVE/INACTIVE/EXPIRED)
 * - By Value: Filter by discount value range
 * - By Scope: Filter by applicable scope
 * - Valid Now: Find currently valid discounts
 * - By Features: Filter by special features (auto-apply, promo code, combinable, etc.)
 * - Advanced: Combine multiple criteria
 * 
 * Enterprise-grade implementation following SOLID principles
 */

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
import { type DiscountSearchParams } from '@/lib/api/discount-search';
import { DiscountScope, DiscountStatus, DiscountType } from '@/types';
import { Calendar, CheckCircle, DollarSign, Filter, Percent, Search, Tag, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'all' | 'code' | 'type' | 'status' | 'value' | 'scope' | 'valid' | 'features' | 'advanced';

/**
 * Props for DiscountSearchFilters component
 */
interface DiscountSearchFiltersProps {
  onSearch: (params: DiscountSearchParams) => void;
  isLoading?: boolean;
}

/**
 * Discount Search Filters Component
 * 
 * Provides comprehensive search functionality for discounts following the same UI/UX as offering search
 */
export function DiscountSearchFilters({ onSearch, isLoading = false }: DiscountSearchFiltersProps) {
  const { t } = useLocale();

  // Search mode state
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  // Search criteria state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType | ''>('');
  const [status, setStatus] = useState<DiscountStatus | ''>('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [applicableScope, setApplicableScope] = useState<DiscountScope | ''>('');
  const [validDate, setValidDate] = useState('');
  
  // Boolean feature flags
  const [autoApply, setAutoApply] = useState<'true' | 'false' | ''>('');
  const [requiresPromoCode, setRequiresPromoCode] = useState<'true' | 'false' | ''>('');
  const [combinable, setCombinable] = useState<'true' | 'false' | ''>('');
  const [firstTimeCustomerOnly, setFirstTimeCustomerOnly] = useState<'true' | 'false' | ''>('');

  // Pagination and sorting state
  const [pageSize, setPageSize] = useState('20');
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  /**
   * Handle search submission
   */
  const handleSearch = () => {
    const params: DiscountSearchParams = {
      page: 0,
      size: parseInt(pageSize) || 20,
      sort: `${sortField},${sortDirection}`,
    };

    // Add search criteria based on mode
    if (searchMode === 'code' && code.trim()) {
      params.code = code.trim();
    } else if (searchMode === 'type' && discountType) {
      params.type = discountType;
    } else if (searchMode === 'status' && status) {
      params.status = status;
    } else if (searchMode === 'value') {
      if (minValue) params.minValue = parseFloat(minValue);
      if (maxValue) params.maxValue = parseFloat(maxValue);
    } else if (searchMode === 'scope' && applicableScope) {
      params.applicableScope = applicableScope;
    } else if (searchMode === 'valid') {
      params.validDate = validDate || new Date().toISOString();
    } else if (searchMode === 'features') {
      if (autoApply) params.autoApply = autoApply === 'true';
      if (requiresPromoCode) params.requiresPromoCode = requiresPromoCode === 'true';
      if (combinable) params.combinable = combinable === 'true';
      if (firstTimeCustomerOnly) params.firstTimeCustomerOnly = firstTimeCustomerOnly === 'true';
    } else if (searchMode === 'advanced') {
      // Advanced mode: combine all criteria
      if (code.trim()) params.code = code.trim();
      if (description.trim()) params.description = description.trim();
      if (discountType) params.type = discountType;
      if (status) params.status = status;
      if (minValue) params.minValue = parseFloat(minValue);
      if (maxValue) params.maxValue = parseFloat(maxValue);
      if (applicableScope) params.applicableScope = applicableScope;
      if (validDate) params.validDate = validDate;
      if (autoApply) params.autoApply = autoApply === 'true';
      if (requiresPromoCode) params.requiresPromoCode = requiresPromoCode === 'true';
      if (combinable) params.combinable = combinable === 'true';
      if (firstTimeCustomerOnly) params.firstTimeCustomerOnly = firstTimeCustomerOnly === 'true';
    }

    onSearch(params);
  };

  /**
   * Handle search mode change
   */
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    // Clear relevant filters when changing modes
    if (mode !== 'code' && mode !== 'advanced') setCode('');
    if (mode !== 'advanced') setDescription('');
    if (mode !== 'type' && mode !== 'advanced') setDiscountType('');
    if (mode !== 'status' && mode !== 'advanced') setStatus('');
    if (mode !== 'value' && mode !== 'advanced') {
      setMinValue('');
      setMaxValue('');
    }
    if (mode !== 'scope' && mode !== 'advanced') setApplicableScope('');
    if (mode !== 'valid' && mode !== 'advanced') setValidDate('');
    if (mode !== 'features' && mode !== 'advanced') {
      setAutoApply('');
      setRequiresPromoCode('');
      setCombinable('');
      setFirstTimeCustomerOnly('');
    }
  };

  /**
   * Handle reset
   */
  const handleReset = () => {
    setCode('');
    setDescription('');
    setDiscountType('');
    setStatus('');
    setMinValue('');
    setMaxValue('');
    setApplicableScope('');
    setValidDate('');
    setAutoApply('');
    setRequiresPromoCode('');
    setCombinable('');
    setFirstTimeCustomerOnly('');
    setPageSize('20');
    setSortField('code');
    setSortDirection('asc');
    setSearchMode('all');
    onSearch({ page: 0, size: 20, sort: 'code,asc' });
  };

  /**
   * Check if search can be executed
   */
  const canSearch = () => {
    if (searchMode === 'all') return true;
    if (searchMode === 'code') return code.trim().length > 0;
    if (searchMode === 'type') return discountType !== '';
    if (searchMode === 'status') return status !== '';
    if (searchMode === 'value') return minValue || maxValue;
    if (searchMode === 'scope') return applicableScope !== '';
    if (searchMode === 'valid') return true;
    if (searchMode === 'features') {
      return autoApply !== '' || requiresPromoCode !== '' || combinable !== '' || firstTimeCustomerOnly !== '';
    }
    if (searchMode === 'advanced') {
      return code.trim().length > 0 || description.trim().length > 0 || discountType !== '' || 
             status !== '' || minValue || maxValue || applicableScope !== '' || validDate ||
             autoApply !== '' || requiresPromoCode !== '' || combinable !== '' || firstTimeCustomerOnly !== '';
    }
    return false;
  };

  /**
   * Get placeholder text based on search mode
   */
  const getPlaceholder = () => {
    if (searchMode === 'code') return t('discount.search.codePlaceholder') || 'e.g., SUMMER2025';
    if (searchMode === 'advanced') return t('discount.search.searchPlaceholder') || 'Search by code...';
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
            {t('discount.search.allDiscounts') || 'All Discounts'}
          </Button>
          <Button
            variant={searchMode === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('code')}
            disabled={isLoading}
            className="h-9"
          >
            <Search className="h-4 w-4 mr-1.5" />
            {t('discount.search.byCode') || 'By Code'}
          </Button>
          <Button
            variant={searchMode === 'type' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('type')}
            disabled={isLoading}
            className="h-9"
          >
            <Percent className="h-4 w-4 mr-1.5" />
            {t('discount.search.byType') || 'By Type'}
          </Button>
          <Button
            variant={searchMode === 'status' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('status')}
            disabled={isLoading}
            className="h-9"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {t('discount.search.byStatus') || 'By Status'}
          </Button>
          <Button
            variant={searchMode === 'value' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('value')}
            disabled={isLoading}
            className="h-9"
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            {t('discount.search.byValue') || 'By Value'}
          </Button>
          <Button
            variant={searchMode === 'scope' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('scope')}
            disabled={isLoading}
            className="h-9"
          >
            <Tag className="h-4 w-4 mr-1.5" />
            {t('discount.search.byScope') || 'By Scope'}
          </Button>
          <Button
            variant={searchMode === 'valid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('valid')}
            disabled={isLoading}
            className="h-9"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            {t('discount.search.validNow') || 'Valid Now'}
          </Button>
          <Button
            variant={searchMode === 'features' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('features')}
            disabled={isLoading}
            className="h-9"
          >
            {t('discount.search.byFeatures') || 'By Features'}
          </Button>
          <Button
            variant={searchMode === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('advanced')}
            disabled={isLoading}
            className="h-9"
          >
            {t('discount.search.advanced') || 'Advanced'}
          </Button>
        </div>

        {/* Search Filters - Dynamic based on mode */}
        <div className="pt-4 space-y-4">
          {/* Code Search Input */}
          {(searchMode === 'code' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="code" className="text-sm font-medium">
                  {t('discount.search.codeLabel') || 'Discount Code'}
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder={getPlaceholder()}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('discount.search.codeHint') || 'Search by discount code (partial match)'}
                </p>
              </div>
            </div>
          )}

          {/* Description Search (Advanced only) */}
          {searchMode === 'advanced' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  {t('discount.search.descriptionLabel') || 'Description'}
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder={t('discount.search.descriptionPlaceholder') || 'Search description...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
            </div>
          )}

          {/* Type Filter */}
          {(searchMode === 'type' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="discountType" className="text-sm font-medium">
                  {t('discount.search.typeLabel') || 'Discount Type'}
                </Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as DiscountType | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="discountType" className="h-10">
                    <SelectValue placeholder={t('discount.search.selectType') || 'Select discount type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">{t('discount.type.percentage') || 'Percentage'}</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">{t('discount.type.fixedAmount') || 'Fixed Amount'}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('discount.search.typeHint') || 'Filter by discount calculation type'}
                </p>
              </div>
            </div>
          )}

          {/* Status Filter */}
          {(searchMode === 'status' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="status" className="text-sm font-medium">
                  {t('discount.search.statusLabel') || 'Status'}
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as DiscountStatus | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder={t('discount.search.selectStatus') || 'Select status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{t('discount.status.active') || 'Active'}</SelectItem>
                    <SelectItem value="INACTIVE">{t('discount.status.inactive') || 'Inactive'}</SelectItem>
                    <SelectItem value="EXPIRED">{t('discount.status.expired') || 'Expired'}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('discount.search.statusHint') || 'Filter by discount status'}
                </p>
              </div>
            </div>
          )}

          {/* Value Range Filters */}
          {(searchMode === 'value' || searchMode === 'advanced') && (
            <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
              <Label className="text-sm font-semibold">{t('discount.search.valueRange') || 'Discount Value Range'}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minValue" className="text-xs font-medium text-muted-foreground">
                    {t('discount.search.minValue') || 'Minimum Value'}
                  </Label>
                  <Input
                    id="minValue"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 10"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxValue" className="text-xs font-medium text-muted-foreground">
                    {t('discount.search.maxValue') || 'Maximum Value'}
                  </Label>
                  <Input
                    id="maxValue"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 50"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('discount.search.valueHint') || 'For percentage: 10-50%, for fixed: $10-$50'}
              </p>
            </div>
          )}

          {/* Scope Filter */}
          {(searchMode === 'scope' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="applicableScope" className="text-sm font-medium">
                  {t('discount.search.scopeLabel') || 'Applicable Scope'}
                </Label>
                <Select
                  value={applicableScope}
                  onValueChange={(value) => setApplicableScope(value as DiscountScope | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="applicableScope" className="h-10">
                    <SelectValue placeholder={t('discount.search.selectScope') || 'Select scope'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t('discount.scope.all') || 'All'}</SelectItem>
                    <SelectItem value="PACKAGE">{t('discount.scope.package') || 'Package'}</SelectItem>
                    <SelectItem value="OFFERING">{t('discount.scope.offering') || 'Offering'}</SelectItem>
                    <SelectItem value="BOOKING">{t('discount.scope.booking') || 'Booking'}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('discount.search.scopeHint') || 'Where this discount can be applied'}
                </p>
              </div>
            </div>
          )}

          {/* Valid Date Filter */}
          {(searchMode === 'valid' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="validDate" className="text-sm font-medium">
                  {t('discount.search.validDateLabel') || 'Valid Date'}
                </Label>
                <DateTimePicker
                  value={validDate}
                  onChange={(value) => setValidDate(value)}
                  disabled={isLoading}
                  showTimeSelect={true}
                />
                <p className="text-xs text-muted-foreground">
                  {t('discount.search.validDateHint') || 'Leave empty to check current date'}
                </p>
              </div>
            </div>
          )}

          {/* Feature Flags Filters */}
          {(searchMode === 'features' || searchMode === 'advanced') && (
            <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
              <Label className="text-sm font-semibold">{t('discount.search.features') || 'Discount Features'}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="autoApply" className="text-xs font-medium text-muted-foreground">
                    {t('discount.search.autoApply') || 'Auto Apply'}
                  </Label>
                  <Select
                    value={autoApply}
                    onValueChange={(value) => setAutoApply(value as 'true' | 'false' | '')}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="autoApply" className="h-9">
                      <SelectValue placeholder={t('discount.search.selectFeature') || 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">{t('common.yes') || 'Yes'}</SelectItem>
                      <SelectItem value="false">{t('common.no') || 'No'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="requiresPromoCode" className="text-xs font-medium text-muted-foreground">
                    {t('discount.search.requiresPromoCode') || 'Requires Promo Code'}
                  </Label>
                  <Select
                    value={requiresPromoCode}
                    onValueChange={(value) => setRequiresPromoCode(value as 'true' | 'false' | '')}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="requiresPromoCode" className="h-9">
                      <SelectValue placeholder={t('discount.search.selectFeature') || 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">{t('common.yes') || 'Yes'}</SelectItem>
                      <SelectItem value="false">{t('common.no') || 'No'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="combinable" className="text-xs font-medium text-muted-foreground">
                    {t('discount.search.combinable') || 'Combinable'}
                  </Label>
                  <Select
                    value={combinable}
                    onValueChange={(value) => setCombinable(value as 'true' | 'false' | '')}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="combinable" className="h-9">
                      <SelectValue placeholder={t('discount.search.selectFeature') || 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">{t('common.yes') || 'Yes'}</SelectItem>
                      <SelectItem value="false">{t('common.no') || 'No'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="firstTimeCustomerOnly" className="text-xs font-medium text-muted-foreground">
                    {t('discount.search.firstTimeCustomer') || 'First-Time Customer Only'}
                  </Label>
                  <Select
                    value={firstTimeCustomerOnly}
                    onValueChange={(value) => setFirstTimeCustomerOnly(value as 'true' | 'false' | '')}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="firstTimeCustomerOnly" className="h-9">
                      <SelectValue placeholder={t('discount.search.selectFeature') || 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">{t('common.yes') || 'Yes'}</SelectItem>
                      <SelectItem value="false">{t('common.no') || 'No'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('discount.search.featuresHint') || 'Filter by discount features and behavior'}
              </p>
            </div>
          )}

          {/* Pagination and Sorting Controls */}
          <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
            <Label className="text-sm font-semibold">{t('common.displayOptions') || 'Display Options'}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pageSize" className="text-xs font-medium text-muted-foreground">
                  {t('common.pageSize') || 'Results per page'}
                </Label>
                <Select value={pageSize} onValueChange={setPageSize} disabled={isLoading}>
                  <SelectTrigger id="pageSize" className="h-9">
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
              <div className="space-y-1.5">
                <Label htmlFor="sortField" className="text-xs font-medium text-muted-foreground">
                  {t('common.sortBy') || 'Sort by'}
                </Label>
                <Select value={sortField} onValueChange={setSortField} disabled={isLoading}>
                  <SelectTrigger id="sortField" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">{t('discount.search.sortCode') || 'Code'}</SelectItem>
                    <SelectItem value="value">{t('discount.search.sortValue') || 'Value'}</SelectItem>
                    <SelectItem value="validFrom">{t('discount.search.sortValidFrom') || 'Valid From'}</SelectItem>
                    <SelectItem value="validTo">{t('discount.search.sortValidTo') || 'Valid To'}</SelectItem>
                    <SelectItem value="priority">{t('discount.search.sortPriority') || 'Priority'}</SelectItem>
                    <SelectItem value="usesCount">{t('discount.search.sortUsage') || 'Usage Count'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sortDirection" className="text-xs font-medium text-muted-foreground">
                  {t('common.order') || 'Order'}
                </Label>
                <Select
                  value={sortDirection}
                  onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="sortDirection" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t('common.ascending') || 'Ascending'}</SelectItem>
                    <SelectItem value="desc">{t('common.descending') || 'Descending'}</SelectItem>
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
              {isLoading ? (t('common.searching') || 'Searching...') : (t('common.search') || 'Search')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="h-10 px-6"
            >
              <X className="h-4 w-4 mr-2" />
              {t('common.reset') || 'Reset'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
