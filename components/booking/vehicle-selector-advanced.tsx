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
import { VehicleImage } from '@/components/vehicle/vehicle-image';
import { useVehicleSearch } from '@/hooks/use-vehicle-search';
import { type VehicleSearchParams, type VehicleStatus } from '@/lib/api/vehicle-search';
import { cn } from '@/lib/utils';
import type { CarType, Vehicle } from '@/types';
import { Car, Check, ChevronDown, ChevronUp, ChevronsUpDown, Filter, Hash, Loader2, Search, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'simple' | 'name' | 'make' | 'model' | 'licensePlate' | 'status' | 'category' | 'seating' | 'advanced';

/**
 * Vehicle Selector Advanced Props
 */
export interface VehicleSelectorAdvancedProps {
  value?: number;
  onChange?: (id: number | null, vehicle: Vehicle | null) => void;
  className?: string;
  disabled?: boolean;
  defaultStatus?: VehicleStatus;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * Vehicle Selector Advanced Component
 * 
 * Enhanced vehicle selection component with advanced search capabilities.
 * Combines the simple search from the original VehicleSelector with the
 * comprehensive search modes from the vehicle page.
 * 
 * Features:
 * - Simple search mode for quick selection
 * - Advanced search modes (by name, make, model, license plate, status, category, seating)
 * - Visual vehicle cards with images
 * - Debounced search input
 * - Backend API integration
 * - Responsive design
 * - Accessible with keyboard navigation
 * 
 * @example
 * <VehicleSelectorAdvanced
 *   value={vehicleId}
 *   onChange={(id, vehicle) => setVehicleId(id)}
 *   defaultStatus="AVAILABLE"
 *   required
 * />
 */
export function VehicleSelectorAdvanced({
  value,
  onChange,
  className,
  disabled = false,
  defaultStatus = 'AVAILABLE',
  label,
  placeholder,
  required = false,
}: VehicleSelectorAdvancedProps) {
  const { t } = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('simple');
  
  // Search state
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>(defaultStatus);
  const [carType, setCarType] = useState<CarType | ''>('');
  const [seaterCount, setSeaterCount] = useState('');
  const [minSeats, setMinSeats] = useState('');
  const [maxSeats, setMaxSeats] = useState('');
  
  // Vehicle search hook
  const {
    vehicles,
    totalPages,
    currentPage,
    isLoading,
    search,
    reset,
    nextPage,
    previousPage,
  } = useVehicleSearch({
    initialParams: {
      status: defaultStatus,
      page: 0,
      size: 10,
      sort: 'name,asc',
    },
  });
  
  // Get selected vehicle
  const selectedVehicle = vehicles.find(v => v.id === value) || null;
  
  /**
   * Execute search based on current mode and filters
   */
  const executeSearch = () => {
    const params: VehicleSearchParams = {
      page: 0,
      size: 10,
      sort: 'name,asc',
    };

    // Add filters based on search mode
    switch (searchMode) {
      case 'simple':
        if (statusFilter) params.status = statusFilter;
        if (searchValue) params.name = searchValue;
        break;

      case 'name':
        if (searchValue) params.name = searchValue;
        if (statusFilter) params.status = statusFilter;
        break;

      case 'make':
        if (searchValue) params.make = searchValue;
        if (statusFilter) params.status = statusFilter;
        break;

      case 'model':
        if (searchValue) params.model = searchValue;
        if (statusFilter) params.status = statusFilter;
        break;

      case 'licensePlate':
        if (searchValue) params.licensePlate = searchValue;
        break;

      case 'status':
        if (statusFilter) params.status = statusFilter;
        break;

      case 'category':
        if (statusFilter) params.status = statusFilter;
        if (carType) params.carType = carType;
        break;

      case 'seating':
        if (statusFilter) params.status = statusFilter;
        if (carType) params.carType = carType;
        if (seaterCount) params.seaterCount = parseInt(seaterCount, 10);
        if (minSeats) params.minSeats = parseInt(minSeats, 10);
        if (maxSeats) params.maxSeats = parseInt(maxSeats, 10);
        break;

      case 'advanced':
        if (statusFilter) params.status = statusFilter;
        if (carType) params.carType = carType;
        if (searchValue) params.make = searchValue;
        if (seaterCount) params.seaterCount = parseInt(seaterCount, 10);
        if (minSeats) params.minSeats = parseInt(minSeats, 10);
        if (maxSeats) params.maxSeats = parseInt(maxSeats, 10);
        break;
    }

    search(params);
  };
  
  /**
   * Handle search button click
   */
  const handleSearchClick = () => {
    executeSearch();
  };
  
  /**
   * Handle reset filters
   */
  const handleReset = () => {
    setSearchMode('simple');
    setSearchValue('');
    setStatusFilter(defaultStatus);
    setCarType('');
    setSeaterCount('');
    setMinSeats('');
    setMaxSeats('');
    search({
      status: defaultStatus,
      page: 0,
      size: 10,
      sort: 'name,asc',
    });
  };
  
  /**
   * Handle mode change
   */
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearchValue('');
    // Reset non-relevant filters
    if (mode !== 'category' && mode !== 'seating' && mode !== 'advanced') {
      setCarType('');
      setSeaterCount('');
      setMinSeats('');
      setMaxSeats('');
    }
    if (mode === 'licensePlate') {
      setStatusFilter('');
    }
  };
  
  // Execute search when dropdown opens
  useEffect(() => {
    if (isOpen) {
      executeSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  
  // Close dropdown when clicking outside
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
  
  // Handle dropdown close
  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setShowAdvanced(false);
    }
  }, [disabled]);
  
  /**
   * Handle vehicle selection
   */
  const handleSelect = (vehicle: Vehicle) => {
    onChange?.(vehicle.id || null, vehicle);
    setIsOpen(false);
    setShowAdvanced(false);
    setSearchValue('');
  };
  
  /**
   * Handle clear selection
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null, null);
  };
  
  /**
   * Get display label for selected vehicle
   */
  const getSelectedLabel = (): string => {
    if (!selectedVehicle) {
      return placeholder || t('vehicle.selectVehicle');
    }
    return `${selectedVehicle.make || ''} ${selectedVehicle.model || ''} ${selectedVehicle.year || ''} - ${selectedVehicle.licensePlate || ''}`.trim();
  };
  
  /**
   * Get status badge color
   */
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-success/20 text-success';
      case 'RENTED':
        return 'bg-info/20 text-info';
      case 'MAINTENANCE':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  /**
   * Get placeholder text based on search mode
   */
  const getPlaceholder = (): string => {
    switch (searchMode) {
      case 'name':
        return t('vehicle.searchPlaceholders.name');
      case 'make':
        return t('vehicle.searchPlaceholders.make');
      case 'model':
        return t('vehicle.searchPlaceholders.model');
      case 'licensePlate':
        return t('vehicle.searchPlaceholders.licensePlate');
      case 'advanced':
        return t('vehicle.searchPlaceholders.advancedMake');
      default:
        return t('vehicle.searchByName');
    }
  };
  
  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      {/* Selector Button */}
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
        
        {/* Dropdown Panel */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 w-full min-w-[400px] max-w-[700px] rounded-md border bg-popover shadow-lg">
            {/* Simple Search Header */}
            <div className="border-b p-3 space-y-3">
              {/* Search Input */}
              {searchMode === 'simple' && (
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('vehicle.searchByName')}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                    className="pl-8 h-9"
                    autoFocus
                  />
                </div>
              )}
              
              {/* Status Filter (Simple Mode) */}
              {searchMode === 'simple' && (
                <div className="flex gap-2">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | '')}
                  >
                    <option value="">{t('vehicle.allStatuses')}</option>
                    <option value="AVAILABLE">{t('vehicle.available')}</option>
                    <option value="RENTED">{t('vehicle.rented')}</option>
                    <option value="MAINTENANCE">{t('vehicle.maintenance')}</option>
                    <option value="UNAVAILABLE">{t('vehicle.unavailable')}</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSearchClick}
                    className="h-9"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Advanced Search Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full h-8 text-xs"
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    {t('vehicle.search.hideAdvanced')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    {t('vehicle.search.showAdvanced')}
                  </>
                )}
              </Button>
            </div>
            
            {/* Advanced Search Panel */}
            {showAdvanced && (
              <div className="border-b p-3 bg-muted/50 space-y-3 max-h-[400px] overflow-y-auto">
                {/* Mode Selection */}
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={searchMode === 'simple' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('simple')}
                    className="h-7 text-xs"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    {t('vehicle.search.simple')}
                  </Button>
                  <Button
                    variant={searchMode === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('name')}
                    className="h-7 text-xs"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {t('vehicle.search.byName')}
                  </Button>
                  <Button
                    variant={searchMode === 'make' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('make')}
                    className="h-7 text-xs"
                  >
                    <Car className="h-3 w-3 mr-1" />
                    {t('vehicle.search.byMake')}
                  </Button>
                  <Button
                    variant={searchMode === 'model' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('model')}
                    className="h-7 text-xs"
                  >
                    {t('vehicle.search.byModel')}
                  </Button>
                  <Button
                    variant={searchMode === 'licensePlate' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('licensePlate')}
                    className="h-7 text-xs"
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {t('vehicle.search.byLicensePlate')}
                  </Button>
                  <Button
                    variant={searchMode === 'status' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('status')}
                    className="h-7 text-xs"
                  >
                    {t('vehicle.search.byStatus')}
                  </Button>
                  <Button
                    variant={searchMode === 'category' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('category')}
                    className="h-7 text-xs"
                  >
                    <Car className="h-3 w-3 mr-1" />
                    {t('vehicle.search.byCategory')}
                  </Button>
                  <Button
                    variant={searchMode === 'seating' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('seating')}
                    className="h-7 text-xs"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {t('vehicle.search.bySeating')}
                  </Button>
                  <Button
                    variant={searchMode === 'advanced' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleModeChange('advanced')}
                    className="h-7 text-xs"
                  >
                    {t('vehicle.search.advanced')}
                  </Button>
                </div>
                
                {/* Search Filters */}
                <div className="space-y-2">
                  {/* Text Search Input */}
                  {(searchMode === 'name' || searchMode === 'make' || searchMode === 'model' || searchMode === 'licensePlate' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {searchMode === 'name' && t('vehicle.search.nameLabel')}
                        {searchMode === 'make' && t('vehicle.search.makeLabel')}
                        {searchMode === 'model' && t('vehicle.search.modelLabel')}
                        {searchMode === 'licensePlate' && t('vehicle.search.licensePlateLabel')}
                        {searchMode === 'advanced' && t('vehicle.search.searchLabel')}
                      </Label>
                      <Input
                        type="text"
                        placeholder={getPlaceholder()}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  {/* Status Filter */}
                  {(searchMode === 'status' || searchMode === 'category' || searchMode === 'seating' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('vehicle.search.statusLabel')}</Label>
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as VehicleStatus | '')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t('vehicle.search.selectStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">{t('vehicle.available')}</SelectItem>
                          <SelectItem value="RENTED">{t('vehicle.rented')}</SelectItem>
                          <SelectItem value="MAINTENANCE">{t('vehicle.maintenance')}</SelectItem>
                          <SelectItem value="UNAVAILABLE">{t('vehicle.unavailable')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Car Type Filter */}
                  {(searchMode === 'category' || searchMode === 'seating' || searchMode === 'advanced') && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('vehicle.search.carTypeLabel')}</Label>
                      <Select value={carType} onValueChange={(value) => setCarType(value as CarType | '')}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder={t('vehicle.search.selectCarType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SEDAN">{t('vehicle.carType.sedan')}</SelectItem>
                          <SelectItem value="SUV">{t('vehicle.carType.suv')}</SelectItem>
                          <SelectItem value="HATCHBACK">{t('vehicle.carType.hatchback')}</SelectItem>
                          <SelectItem value="VAN">{t('vehicle.carType.van')}</SelectItem>
                          <SelectItem value="PICKUP">{t('vehicle.carType.pickup')}</SelectItem>
                          <SelectItem value="LUXURY">{t('vehicle.carType.luxury')}</SelectItem>
                          <SelectItem value="SPORTS">{t('vehicle.carType.sports')}</SelectItem>
                          <SelectItem value="ELECTRIC">{t('vehicle.carType.electric')}</SelectItem>
                          <SelectItem value="HYBRID">{t('vehicle.carType.hybrid')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Seating Capacity Filters */}
                  {(searchMode === 'seating' || searchMode === 'advanced') && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t('vehicle.search.exactSeats')}</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="5"
                          value={seaterCount}
                          onChange={(e) => setSeaterCount(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('vehicle.search.minSeats')}</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="4"
                          value={minSeats}
                          onChange={(e) => setMinSeats(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('vehicle.search.maxSeats')}</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="7"
                          value={maxSeats}
                          onChange={(e) => setMaxSeats(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSearchClick}
                    className="h-8 text-xs flex-1"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {t('vehicle.search.search')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('vehicle.search.reset')}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Vehicle List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : vehicles.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('vehicle.noVehiclesFound')}
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-accent transition-colors',
                        value === vehicle.id && 'bg-accent'
                      )}
                      onClick={() => handleSelect(vehicle)}
                    >
                      {/* Selection Indicator */}
                      <div className="pt-1">
                        <Check
                          className={cn(
                            'h-4 w-4',
                            value === vehicle.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </div>
                      
                      {/* Vehicle Image */}
                      <div className="shrink-0">
                        <VehicleImage
                          src={vehicle.primaryImageUrl}
                          alt={`${vehicle.name || 'Vehicle'}`}
                          className="w-20 h-16 rounded-md object-cover"
                        />
                      </div>
                      
                      {/* Vehicle Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {vehicle.name || t('vehicle.unnamedVehicle')}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {vehicle.make || ''} {vehicle.model || ''} ({vehicle.year || ''})
                            </p>
                          </div>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
                              getStatusColor(vehicle.status)
                            )}
                          >
                            {vehicle.status ? t(`vehicle.${vehicle.status.toLowerCase()}`) : ''}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{vehicle.licensePlate || t('common.notAvailable')}</span>
                          <span>•</span>
                          <span>{vehicle.fuelType || t('common.notAvailable')}</span>
                          <span>•</span>
                          <span>{vehicle.transmissionType || t('common.notAvailable')}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t p-2 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={currentPage === 0}
                >
                  {t('common.previous')}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {t('common.page')} {currentPage + 1} {t('common.of')} {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage >= totalPages - 1}
                >
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
