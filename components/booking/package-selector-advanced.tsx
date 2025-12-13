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
import { usePackageSearch } from '@/hooks/use-package-search';
import { type PackageSearchParams } from '@/lib/api/package-search';
import { cn } from '@/lib/utils';
import type { Package, PackageModifierType } from '@/types';
import { Check, ChevronDown, ChevronUp, ChevronsUpDown, DollarSign, Filter, Loader2, Package as PackageIcon, Percent, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'simple' | 'name' | 'type' | 'modifier' | 'valid' | 'discount' | 'advanced';

/**
 * Package Selector Advanced Props
 */
export interface PackageSelectorAdvancedProps {
  value?: number;
  onChange?: (id: number | null, packageItem: Package | null) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Package Selector Advanced Component
 * 
 * Enhanced package selection component with advanced search capabilities.
 * 
 * Features:
 * - Simple search mode for quick selection
 * - Advanced search modes (by name, type, modifier, valid date, discount allowance)
 * - Visual package cards with details
 * - Backend API integration
 * - Responsive design
 */
export function PackageSelectorAdvanced({
  value,
  onChange,
  className,
  disabled = false,
  label,
  placeholder,
  required = false,
}: PackageSelectorAdvancedProps) {
  const { t, formatCurrency } = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  
  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [modifierType, setModifierType] = useState<PackageModifierType | ''>('');
  const [minModifier, setMinModifier] = useState('');
  const [maxModifier, setMaxModifier] = useState('');
  const [allowDiscountOnModifier, setAllowDiscountOnModifier] = useState<'true' | 'false' | ''>('');
  
  // Package search hook
  const {
    packages,
    totalPages,
    currentPage,
    isLoading,
    search,
    reset,
    nextPage,
    previousPage,
  } = usePackageSearch({
    initialParams: {
      page: 0,
      size: 10,
      sort: 'name,asc',
    },
  });
  
  // Get selected package
  const selectedPackage = packages.find(p => p.id === value) || null;
  
  /**
   * Execute search based on current mode and filters
   */
  const executeSearch = () => {
    const params: PackageSearchParams = {
      page: 0,
      size: 10,
      sort: 'name,asc',
    };

    switch (searchMode) {
      case 'simple':
        if (searchValue) params.name = searchValue;
        break;
      case 'name':
        if (searchValue) params.name = searchValue;
        break;
      case 'type':
        if (modifierType) params.modifierType = modifierType;
        break;
      case 'modifier':
        if (minModifier) params.minModifier = parseFloat(minModifier);
        if (maxModifier) params.maxModifier = parseFloat(maxModifier);
        break;
      case 'valid':
        params.validDate = new Date().toISOString();
        break;
      case 'discount':
        if (allowDiscountOnModifier) params.allowDiscountOnModifier = allowDiscountOnModifier === 'true';
        break;
      case 'advanced':
        if (searchValue) params.name = searchValue;
        if (modifierType) params.modifierType = modifierType;
        if (minModifier) params.minModifier = parseFloat(minModifier);
        if (maxModifier) params.maxModifier = parseFloat(maxModifier);
        if (allowDiscountOnModifier) params.allowDiscountOnModifier = allowDiscountOnModifier === 'true';
        break;
    }

    search(params);
  };
  
  const handleSearchClick = () => executeSearch();
  
  const handleReset = () => {
    setSearchMode('simple');
    setSearchValue('');
    setModifierType('');
    setMinModifier('');
    setMaxModifier('');
    setAllowDiscountOnModifier('');
    search({ page: 0, size: 10, sort: 'name,asc' });
  };
  
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearchValue('');
    if (mode !== 'type' && mode !== 'advanced') setModifierType('');
    if (mode !== 'modifier' && mode !== 'advanced') {
      setMinModifier('');
      setMaxModifier('');
    }
    if (mode !== 'discount' && mode !== 'advanced') setAllowDiscountOnModifier('');
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
  
  const handleSelect = (packageItem: Package) => {
    onChange?.(packageItem.id || null, packageItem);
    setIsOpen(false);
    setShowAdvanced(false);
    setSearchValue('');
  };
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null, null);
  };
  
  const getSelectedLabel = (): string => {
    if (!selectedPackage) {
      return placeholder || t('package.selectPackage');
    }
    return selectedPackage.name || t('package.unnamedPackage');
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
                    placeholder={t('package.searchByName')}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
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
                    {t('package.search.hideAdvanced')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    {t('package.search.showAdvanced')}
                  </>
                )}
              </Button>
            </div>
            
            {showAdvanced && (
              <div className="border-b p-3 bg-muted/50 space-y-3 max-h-[400px] overflow-y-auto">
                {/* Mode Selection */}
                <div className="flex flex-wrap gap-1">
                  <Button variant={searchMode === 'simple' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('simple')} className="h-7 text-xs">
                    <Filter className="h-3 w-3 mr-1" /> {t('package.search.simple')}
                  </Button>
                  <Button variant={searchMode === 'name' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('name')} className="h-7 text-xs">
                    <Search className="h-3 w-3 mr-1" /> {t('package.search.byName')}
                  </Button>
                  <Button variant={searchMode === 'type' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('type')} className="h-7 text-xs">
                    <PackageIcon className="h-3 w-3 mr-1" /> {t('package.search.byType')}
                  </Button>
                  <Button variant={searchMode === 'modifier' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('modifier')} className="h-7 text-xs">
                    <Percent className="h-3 w-3 mr-1" /> {t('package.search.byModifier')}
                  </Button>
                  <Button variant={searchMode === 'valid' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('valid')} className="h-7 text-xs">
                    {t('package.search.validNow')}
                  </Button>
                  <Button variant={searchMode === 'discount' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('discount')} className="h-7 text-xs">
                    <DollarSign className="h-3 w-3 mr-1" /> {t('package.search.byDiscount')}
                  </Button>
                  <Button variant={searchMode === 'advanced' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('advanced')} className="h-7 text-xs">
                    {t('package.search.advanced')}
                  </Button>
                </div>
                
                {/* Search Filters */}
                <div className="space-y-2">
                  {(searchMode === 'name' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('package.search.nameLabel')}</Label>
                      <Input
                        type="text"
                        placeholder={t('package.searchPlaceholders.name')}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  {(searchMode === 'type' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('package.search.typeLabel')}</Label>
                      <Select value={modifierType} onValueChange={(value) => setModifierType(value as PackageModifierType | '')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t('package.search.selectType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">{t('package.modifierType.percentage')}</SelectItem>
                          <SelectItem value="FIXED">{t('package.modifierType.fixed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(searchMode === 'modifier' || searchMode === 'advanced') && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t('package.search.minModifier')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={minModifier}
                          onChange={(e) => setMinModifier(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('package.search.maxModifier')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1"
                          value={maxModifier}
                          onChange={(e) => setMaxModifier(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {(searchMode === 'discount' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('package.search.allowDiscount')}</Label>
                      <Select value={allowDiscountOnModifier} onValueChange={(value) => setAllowDiscountOnModifier(value as 'true' | 'false' | '')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t('package.search.selectAllowDiscount')} />
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
            
            {/* Package List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : packages.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('package.noPackagesFound')}
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-3 rounded-md p-3 text-left hover:bg-accent transition-colors',
                        value === pkg.id && 'bg-accent'
                      )}
                      onClick={() => handleSelect(pkg)}
                    >
                      <div className="pt-1">
                        <Check className={cn('h-4 w-4', value === pkg.id ? 'opacity-100' : 'opacity-0')} />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{pkg.name || t('package.unnamedPackage')}</p>
                          <span className="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap bg-primary/20 text-primary">
                            {pkg.modifierType === 'PERCENTAGE' ? `${((pkg.priceModifier || 0) * 100).toFixed(0)}%` : formatCurrency(pkg.priceModifier || 0)}
                          </span>
                        </div>
                        {pkg.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{pkg.description}</p>
                        )}
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{pkg.modifierType === 'PERCENTAGE' ? t('package.modifierType.percentage') : t('package.modifierType.fixed')}</span>
                          {pkg.minRentalDays && (
                            <>
                              <span>•</span>
                              <span>{pkg.minRentalDays}+ {t('package.daysMin')}</span>
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
