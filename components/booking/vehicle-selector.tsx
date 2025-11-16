'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleImage } from '@/components/vehicle/vehicle-image';
import { useVehicleSearch } from '@/hooks/use-vehicle-search';
import { type VehicleStatus } from '@/lib/api/vehicle-search';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/types';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Vehicle Selector Props
 */
export interface VehicleSelectorProps {
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
 * Vehicle Selector Component
 * 
 * Professional vehicle selection component with integrated search functionality.
 * Based on the same UI/UX patterns as the vehicle dashboard.
 * 
 * Features:
 * - Search by name, make, model, license plate
 * - Filter by vehicle status
 * - Visual vehicle cards with images
 * - Debounced search input
 * - Responsive design
 * - Accessible with keyboard navigation
 * - Clean, SOLID implementation
 * 
 * @example
 * <VehicleSelector
 *   value={vehicleId}
 *   onChange={(id, vehicle) => setVehicleId(id)}
 *   defaultStatus="AVAILABLE"
 *   required
 * />
 */
export function VehicleSelector({
  value,
  onChange,
  className,
  disabled = false,
  defaultStatus = 'AVAILABLE',
  label,
  placeholder,
  required = false,
}: VehicleSelectorProps) {
  const { t } = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>(defaultStatus);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
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
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Execute search when filters change
  useEffect(() => {
    if (isOpen) {
      search({
        page: 0,
        size: 10,
        sort: 'name,asc',
        ...(statusFilter && { status: statusFilter }),
        ...(debouncedSearchTerm && { name: debouncedSearchTerm }),
      });
    }
  }, [debouncedSearchTerm, statusFilter, isOpen, search]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
    }
  }, [disabled]);
  
  /**
   * Handle vehicle selection
   */
  const handleSelect = (vehicle: Vehicle) => {
    onChange?.(vehicle.id || null, vehicle);
    setIsOpen(false);
    setSearchTerm('');
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
          <div className="absolute z-50 mt-2 w-full min-w-[400px] max-w-[600px] rounded-md border bg-popover shadow-lg">
            {/* Search and Filter Header */}
            <div className="border-b p-3 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('vehicle.searchByName')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                  autoFocus
                />
              </div>
              
              {/* Status Filter */}
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
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter(defaultStatus);
                    reset();
                  }}
                  className="h-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
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
