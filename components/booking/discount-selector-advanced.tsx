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
import { useDiscountSearch } from '@/hooks/use-discount-search';
import { type DiscountSearchParams } from '@/lib/api/discount-search';
import { cn } from '@/lib/utils';
import type { Discount, DiscountScope, DiscountStatus, DiscountType } from '@/types';
import { Check, CheckCircle, ChevronDown, ChevronUp, ChevronsUpDown, DollarSign, Filter, Loader2, Percent, Search, Tag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'simple' | 'code' | 'type' | 'status' | 'value' | 'scope' | 'valid' | 'features' | 'advanced';

/**
 * Discount Selector Advanced Props
 */
export interface DiscountSelectorAdvancedProps {
  value?: number;
  onChange?: (id: number | null, discount: Discount | null) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Discount Selector Advanced Component
 * 
 * Enhanced discount selection component with advanced search capabilities.
 * 
 * Features:
 * - Simple search mode for quick selection
 * - Advanced search modes (by code, type, status, value, scope, features)
 * - Visual discount cards with details
 * - Backend API integration
 * - Responsive design
 */
export function DiscountSelectorAdvanced({
  value,
  onChange,
  className,
  disabled = false,
  label,
  placeholder,
  required = false,
}: DiscountSelectorAdvancedProps) {
  const { t, formatCurrency } = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  
  // Search state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType | ''>('');
  const [status, setStatus] = useState<DiscountStatus | ''>('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [applicableScope, setApplicableScope] = useState<DiscountScope | ''>('');
  const [autoApply, setAutoApply] = useState<'true' | 'false' | ''>('');
  
  // Discount search hook
  const {
    discounts,
    totalPages,
    currentPage,
    isLoading,
    search,
    reset,
    nextPage,
    previousPage,
  } = useDiscountSearch({
    initialParams: {
      page: 0,
      size: 10,
      sort: 'code,asc',
    },
  });
  
  // Get selected discount
  const selectedDiscount = discounts.find(d => d.id === value) || null;
  
  /**
   * Execute search based on current mode and filters
   */
  const executeSearch = () => {
    const params: DiscountSearchParams = {
      page: 0,
      size: 10,
      sort: 'code,asc',
    };

    switch (searchMode) {
      case 'simple':
        if (code) params.code = code;
        break;
      case 'code':
        if (code) params.code = code;
        break;
      case 'type':
        if (discountType) params.type = discountType;
        break;
      case 'status':
        if (status) params.status = status;
        break;
      case 'value':
        if (minValue) params.minValue = parseFloat(minValue);
        if (maxValue) params.maxValue = parseFloat(maxValue);
        break;
      case 'scope':
        if (applicableScope) params.applicableScope = applicableScope;
        break;
      case 'valid':
        params.validDate = new Date().toISOString();
        break;
      case 'features':
        if (autoApply) params.autoApply = autoApply === 'true';
        break;
      case 'advanced':
        if (code) params.code = code;
        if (discountType) params.type = discountType;
        if (status) params.status = status;
        if (minValue) params.minValue = parseFloat(minValue);
        if (maxValue) params.maxValue = parseFloat(maxValue);
        if (applicableScope) params.applicableScope = applicableScope;
        if (autoApply) params.autoApply = autoApply === 'true';
        break;
    }

    search(params);
  };
  
  const handleSearchClick = () => executeSearch();
  
  const handleReset = () => {
    setSearchMode('simple');
    setCode('');
    setDiscountType('');
    setStatus('');
    setMinValue('');
    setMaxValue('');
    setApplicableScope('');
    setAutoApply('');
    search({ page: 0, size: 10, sort: 'code,asc' });
  };
  
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setCode('');
    if (mode !== 'type' && mode !== 'advanced') setDiscountType('');
    if (mode !== 'status' && mode !== 'advanced') setStatus('');
    if (mode !== 'value' && mode !== 'advanced') {
      setMinValue('');
      setMaxValue('');
    }
    if (mode !== 'scope' && mode !== 'advanced') setApplicableScope('');
    if (mode !== 'features' && mode !== 'advanced') setAutoApply('');
  };
  
  useEffect(() => {
    if (isOpen) executeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAdvanced(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setShowAdvanced(false);
    }
  }, [disabled]);
  
  const handleSelect = (discount: Discount) => {
    onChange?.(discount.id || null, discount);
    setIsOpen(false);
    setShowAdvanced(false);
    setCode('');
  };
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null, null);
  };
  
  const getSelectedLabel = (): string => {
    if (!selectedDiscount) {
      return placeholder || t('discount.selectDiscount');
    }
    return `${selectedDiscount.code} - ${selectedDiscount.description || ''}`.trim();
  };
  
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success/20 text-success';
      case 'INACTIVE':
        return 'bg-muted text-muted-foreground';
      case 'EXPIRED':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          aria-required={required}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground'
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className="truncate flex-1 text-left">{getSelectedLabel()}</span>
          <div className="flex items-center gap-2 ml-2">
            {value && !disabled && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
        
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 w-full min-w-[400px] max-w-[700px] rounded-md border bg-popover shadow-lg">
            {/* Simple Search Header */}
            <div className="border-b p-3 space-y-3">
              {searchMode === 'simple' && (
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('discount.searchByCode')}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                    className="pl-8 h-9"
                    autoFocus
                  />
                </div>
              )}
              
              {searchMode === 'simple' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearchClick}
                  className="h-9 w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {t('common.search')}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full h-8 text-xs"
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    {t('discount.search.hideAdvanced')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    {t('discount.search.showAdvanced')}
                  </>
                )}
              </Button>
            </div>
            
            {showAdvanced && (
              <div className="border-b p-3 bg-muted/50 space-y-3 max-h-[400px] overflow-y-auto">
                {/* Mode Selection */}
                <div className="flex flex-wrap gap-1">
                  <Button variant={searchMode === 'simple' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('simple')} className="h-7 text-xs">
                    <Filter className="h-3 w-3 mr-1" /> {t('discount.search.simple')}
                  </Button>
                  <Button variant={searchMode === 'code' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('code')} className="h-7 text-xs">
                    <Tag className="h-3 w-3 mr-1" /> {t('discount.search.byCode')}
                  </Button>
                  <Button variant={searchMode === 'type' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('type')} className="h-7 text-xs">
                    <Percent className="h-3 w-3 mr-1" /> {t('discount.search.byType')}
                  </Button>
                  <Button variant={searchMode === 'status' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('status')} className="h-7 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" /> {t('discount.search.byStatus')}
                  </Button>
                  <Button variant={searchMode === 'value' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('value')} className="h-7 text-xs">
                    <DollarSign className="h-3 w-3 mr-1" /> {t('discount.search.byValue')}
                  </Button>
                  <Button variant={searchMode === 'scope' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('scope')} className="h-7 text-xs">
                    {t('discount.search.byScope')}
                  </Button>
                  <Button variant={searchMode === 'valid' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('valid')} className="h-7 text-xs">
                    {t('discount.search.validNow')}
                  </Button>
                  <Button variant={searchMode === 'features' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('features')} className="h-7 text-xs">
                    {t('discount.search.byFeatures')}
                  </Button>
                  <Button variant={searchMode === 'advanced' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('advanced')} className="h-7 text-xs">
                    {t('discount.search.advanced')}
                  </Button>
                </div>
                
                {/* Search Filters */}
                <div className="space-y-2">
                  {(searchMode === 'code' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('discount.search.codeLabel')}</Label>
                      <Input
                        type="text"
                        placeholder={t('discount.searchPlaceholders.code')}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  {(searchMode === 'type' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('discount.search.typeLabel')}</Label>
                      <Select value={discountType} onValueChange={(value) => setDiscountType(value as DiscountType | '')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t('discount.search.selectType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">{t('discount.type.percentage')}</SelectItem>
                          <SelectItem value="FIXED_AMOUNT">{t('discount.type.fixedAmount')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(searchMode === 'status' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('discount.search.statusLabel')}</Label>
                      <Select value={status} onValueChange={(value) => setStatus(value as DiscountStatus | '')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t('discount.search.selectStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">{t('discount.status.active')}</SelectItem>
                          <SelectItem value="INACTIVE">{t('discount.status.inactive')}</SelectItem>
                          <SelectItem value="EXPIRED">{t('discount.status.expired')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(searchMode === 'value' || searchMode === 'advanced') && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t('discount.search.minValue')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={minValue}
                          onChange={(e) => setMinValue(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('discount.search.maxValue')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100"
                          value={maxValue}
                          onChange={(e) => setMaxValue(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {(searchMode === 'scope' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('discount.search.scopeLabel')}</Label>
                      <Select value={applicableScope} onValueChange={(value) => setApplicableScope(value as DiscountScope | '')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t('discount.search.selectScope')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">{t('discount.scope.all')}</SelectItem>
                          <SelectItem value="PACKAGE">{t('discount.scope.package')}</SelectItem>
                          <SelectItem value="OFFERING">{t('discount.scope.offering')}</SelectItem>
                          <SelectItem value="BOOKING">{t('discount.scope.booking') || 'Booking'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(searchMode === 'features' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('discount.search.autoApply')}</Label>
                      <Select value={autoApply} onValueChange={(value) => setAutoApply(value as 'true' | 'false' | '')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t('discount.search.selectAutoApply')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">{t('common.yes')}</SelectItem>
                          <SelectItem value="false">{t('common.no')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSearchClick} className="h-8 text-xs flex-1">
                    <Search className="h-3 w-3 mr-1" /> {t('common.search')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs">
                    <X className="h-3 w-3 mr-1" /> {t('common.reset')}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Discount List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : discounts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('discount.noDiscountsFound')}
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {discounts.map((discount) => (
                    <button
                      key={discount.id}
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-3 rounded-md p-3 text-left hover:bg-accent transition-colors',
                        value === discount.id && 'bg-accent'
                      )}
                      onClick={() => handleSelect(discount)}
                    >
                      <div className="pt-1">
                        <Check className={cn('h-4 w-4', value === discount.id ? 'opacity-100' : 'opacity-0')} />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{discount.code}</p>
                            {discount.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{discount.description}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap bg-primary/20 text-primary">
                              {discount.type === 'PERCENTAGE' ? `${discount.value}%` : formatCurrency(discount.value || 0)}
                            </span>
                            <span className={cn('px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap', getStatusColor(discount.status))}>
                              {discount.status ? t(`discount.status.${discount.status.toLowerCase()}`) : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{discount.type === 'PERCENTAGE' ? t('discount.type.percentage') : t('discount.type.fixedAmount')}</span>
                          {discount.applicableScope && (
                            <>
                              <span>•</span>
                              <span>{t(`discount.scope.${discount.applicableScope.toLowerCase()}`)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {totalPages > 1 && (
              <div className="border-t p-2 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={previousPage} disabled={currentPage === 0}>
                  {t('common.previous')}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {t('common.page')} {currentPage + 1} {t('common.of')} {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage >= totalPages - 1}>
                  {t('common.next')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
