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
import { type VehicleSearchParams, type VehicleStatus } from '@/lib/api/vehicle-search';
import { type CarType } from '@/types';
import { Car, Filter, Hash, Search, Users, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'all' | 'name' | 'make' | 'model' | 'licensePlate' | 'status' | 'category' | 'seating' | 'advanced';

/**
 * Props for VehicleSearchFilters component
 */
interface VehicleSearchFiltersProps {
  onSearch: (params: VehicleSearchParams) => void;
  isLoading?: boolean;
}

/**
 * Vehicle Search Filters Component
 * 
 * Professional, compact search interface for vehicles with multiple search modes:
 * - All Vehicles: List all vehicles with pagination
 * - By Name: Search by vehicle name
 * - By Make: Search by manufacturer
 * - By Model: Search by model
 * - By License Plate: Search by plate number
 * - By Status: Filter by availability status
 * - Advanced: Combine status and search criteria
 * 
 * Enterprise-grade implementation with:
 * - SOLID principles (Single Responsibility, Open/Closed, Interface Segregation)
 * - KISS approach (Keep It Simple, Stupid)
 * - Professional, compact UI/UX
 * - Type-safe with comprehensive validation
 * - Accessible with proper ARIA labels
 * - Responsive design with mobile-first approach
 */
export function VehicleSearchFilters({ onSearch, isLoading = false }: VehicleSearchFiltersProps) {
  const { t } = useLocale();

  // Search mode state
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  // Search criteria state
  const [searchValue, setSearchValue] = useState('');
  const [status, setStatus] = useState<VehicleStatus | ''>('');
  const [carType, setCarType] = useState<CarType | ''>('');
  const [seaterCount, setSeaterCount] = useState('');
  const [minSeats, setMinSeats] = useState('');
  const [maxSeats, setMaxSeats] = useState('');

  // Pagination and sorting state
  const [pageSize, setPageSize] = useState('20');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  /**
   * Handle search submission
   */
  const handleSearch = () => {
    // Build search parameters based on mode
    const params: VehicleSearchParams = {
      page: 0,
      size: parseInt(pageSize, 10),
      sort: `${sortField},${sortDirection}`,
    };

    switch (searchMode) {
      case 'name':
        if (searchValue) params.name = searchValue;
        break;

      case 'make':
        if (searchValue) params.make = searchValue;
        break;

      case 'model':
        if (searchValue) params.model = searchValue;
        break;

      case 'licensePlate':
        if (searchValue) params.licensePlate = searchValue;
        break;

      case 'status':
        if (status !== '') params.status = status;
        break;

      case 'category':
        if (status !== '') params.status = status;
        if (carType !== '') params.carType = carType;
        break;

      case 'seating':
        if (status !== '') params.status = status;
        if (carType !== '') params.carType = carType;
        if (seaterCount) params.seaterCount = parseInt(seaterCount, 10);
        if (minSeats) params.minSeats = parseInt(minSeats, 10);
        if (maxSeats) params.maxSeats = parseInt(maxSeats, 10);
        break;

      case 'advanced':
        if (status !== '') params.status = status;
        if (carType !== '') params.carType = carType;
        if (searchValue) params.make = searchValue;
        if (seaterCount) params.seaterCount = parseInt(seaterCount, 10);
        if (minSeats) params.minSeats = parseInt(minSeats, 10);
        if (maxSeats) params.maxSeats = parseInt(maxSeats, 10);
        break;

      case 'all':
      default:
        // No additional params needed
        break;
    }

    onSearch(params);
  };

  /**
   * Reset all filters
   */
  const handleReset = () => {
    setSearchMode('all');
    setSearchValue('');
    setStatus('');
    setCarType('');
    setSeaterCount('');
    setMinSeats('');
    setMaxSeats('');
    setPageSize('20');
    setSortField('name');
    setSortDirection('asc');
    onSearch({ page: 0, size: 20, sort: 'name,asc' });
  };

  /**
   * Check if search can be performed
   */
  const canSearch = (): boolean => {
    switch (searchMode) {
      case 'all':
        return true;
      case 'name':
      case 'make':
      case 'model':
      case 'licensePlate':
        return searchValue.trim() !== '';
      case 'status':
        return status !== '';
      case 'category':
        return status !== '' || carType !== '';
      case 'seating':
        return status !== '' || carType !== '' || seaterCount !== '' || minSeats !== '' || maxSeats !== '';
      case 'advanced':
        return searchValue.trim() !== '' || status !== '' || carType !== '' || seaterCount !== '' || minSeats !== '' || maxSeats !== '';
      default:
        return false;
    }
  };

  /**
   * Handle mode change and reset relevant fields
   */
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearchValue('');
    // Only reset filters that aren't relevant to the new mode
    if (mode !== 'category' && mode !== 'seating' && mode !== 'advanced') {
      setCarType('');
      setSeaterCount('');
      setMinSeats('');
      setMaxSeats('');
    }
    if (mode !== 'status' && mode !== 'category' && mode !== 'seating' && mode !== 'advanced') {
      setStatus('');
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
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex flex-col gap-4">
        {/* Mode Selection - Compact Button Group */}
        <div className="flex flex-wrap gap-2 pb-3 border-b">
          <Button
            variant={searchMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('all')}
            disabled={isLoading}
            className="h-9"
          >
            <Filter className="h-4 w-4 mr-1.5" />
            {t('vehicle.search.allVehicles')}
          </Button>
          <Button
            variant={searchMode === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('name')}
            disabled={isLoading}
            className="h-9"
          >
            <Search className="h-4 w-4 mr-1.5" />
            {t('vehicle.search.byName')}
          </Button>
          <Button
            variant={searchMode === 'make' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('make')}
            disabled={isLoading}
            className="h-9"
          >
            <Car className="h-4 w-4 mr-1.5" />
            {t('vehicle.search.byMake')}
          </Button>
          <Button
            variant={searchMode === 'model' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('model')}
            disabled={isLoading}
            className="h-9"
          >
            {t('vehicle.search.byModel')}
          </Button>
          <Button
            variant={searchMode === 'licensePlate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('licensePlate')}
            disabled={isLoading}
            className="h-9"
          >
            <Hash className="h-4 w-4 mr-1.5" />
            {t('vehicle.search.byLicensePlate')}
          </Button>
          <Button
            variant={searchMode === 'status' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('status')}
            disabled={isLoading}
            className="h-9"
          >
            {t('vehicle.search.byStatus')}
          </Button>
          <Button
            variant={searchMode === 'category' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('category')}
            disabled={isLoading}
            className="h-9"
          >
            <Car className="h-4 w-4 mr-1.5" />
            {t('vehicle.search.byCategory')}
          </Button>
          <Button
            variant={searchMode === 'seating' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('seating')}
            disabled={isLoading}
            className="h-9"
          >
            <Users className="h-4 w-4 mr-1.5" />
            {t('vehicle.search.bySeating')}
          </Button>
          <Button
            variant={searchMode === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('advanced')}
            disabled={isLoading}
            className="h-9"
          >
            {t('vehicle.search.advanced')}
          </Button>
        </div>

        {/* Search Filters - Dynamic based on mode */}
        <div className="flex flex-col gap-4">
          {/* Text Search Input */}
          {(searchMode === 'name' || searchMode === 'make' || searchMode === 'model' || searchMode === 'licensePlate' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="searchValue" className="text-sm font-medium">
                  {searchMode === 'name' && t('vehicle.search.nameLabel')}
                  {searchMode === 'make' && t('vehicle.search.makeLabel')}
                  {searchMode === 'model' && t('vehicle.search.modelLabel')}
                  {searchMode === 'licensePlate' && t('vehicle.search.licensePlateLabel')}
                  {searchMode === 'advanced' && t('vehicle.search.searchLabel')}
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
                  {searchMode === 'name' && t('vehicle.search.nameHint')}
                  {searchMode === 'make' && t('vehicle.search.makeHint')}
                  {searchMode === 'model' && t('vehicle.search.modelHint')}
                  {searchMode === 'licensePlate' && t('vehicle.search.licensePlateHint')}
                  {searchMode === 'advanced' && t('vehicle.search.advancedHint')}
                </p>
              </div>
            </div>
          )}

          {/* Status Filter */}
          {(searchMode === 'status' || searchMode === 'category' || searchMode === 'seating' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="status" className="text-sm font-medium">
                  {t('vehicle.search.statusLabel')}
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as VehicleStatus | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder={t('vehicle.search.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">{t('vehicle.available')}</SelectItem>
                    <SelectItem value="RENTED">{t('vehicle.rented')}</SelectItem>
                    <SelectItem value="MAINTENANCE">{t('vehicle.maintenance')}</SelectItem>
                    <SelectItem value="UNAVAILABLE">{t('vehicle.unavailable')}</SelectItem>
                  </SelectContent>
                </Select>
                {(searchMode === 'category' || searchMode === 'seating' || searchMode === 'advanced') && status && (
                  <button
                    type="button"
                    onClick={() => setStatus('')}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {t('vehicle.search.clearStatus')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Car Type Filter */}
          {(searchMode === 'category' || searchMode === 'seating' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="carType" className="text-sm font-medium">
                  {t('vehicle.search.carTypeLabel')}
                </Label>
                <Select
                  value={carType}
                  onValueChange={(value) => setCarType(value as CarType | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="carType" className="h-10">
                    <SelectValue placeholder={t('vehicle.search.selectCarType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEDAN">{t('vehicle.carType.sedan')}</SelectItem>
                    <SelectItem value="SUV">{t('vehicle.carType.suv')}</SelectItem>
                    <SelectItem value="HATCHBACK">{t('vehicle.carType.hatchback')}</SelectItem>
                    <SelectItem value="COUPE">{t('vehicle.carType.coupe')}</SelectItem>
                    <SelectItem value="CONVERTIBLE">{t('vehicle.carType.convertible')}</SelectItem>
                    <SelectItem value="WAGON">{t('vehicle.carType.wagon')}</SelectItem>
                    <SelectItem value="VAN">{t('vehicle.carType.van')}</SelectItem>
                    <SelectItem value="PICKUP">{t('vehicle.carType.pickup')}</SelectItem>
                    <SelectItem value="LUXURY">{t('vehicle.carType.luxury')}</SelectItem>
                    <SelectItem value="SPORTS">{t('vehicle.carType.sports')}</SelectItem>
                    <SelectItem value="ELECTRIC">{t('vehicle.carType.electric')}</SelectItem>
                    <SelectItem value="HYBRID">{t('vehicle.carType.hybrid')}</SelectItem>
                    <SelectItem value="MOTORCYCLE">{t('vehicle.carType.motorcycle')}</SelectItem>
                    <SelectItem value="OTHER">{t('vehicle.carType.other')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('vehicle.search.carTypeHint')}
                </p>
              </div>
            </div>
          )}

          {/* Seating Capacity Filters */}
          {(searchMode === 'seating' || searchMode === 'advanced') && (
            <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
              <Label className="text-sm font-semibold">{t('vehicle.search.seatingCapacity')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="seaterCount" className="text-xs font-medium text-muted-foreground">
                    {t('vehicle.search.exactSeats')}
                  </Label>
                  <Input
                    id="seaterCount"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="e.g., 5"
                    value={seaterCount}
                    onChange={(e) => setSeaterCount(e.target.value)}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="minSeats" className="text-xs font-medium text-muted-foreground">
                    {t('vehicle.search.minSeats')}
                  </Label>
                  <Input
                    id="minSeats"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="e.g., 4"
                    value={minSeats}
                    onChange={(e) => setMinSeats(e.target.value)}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxSeats" className="text-xs font-medium text-muted-foreground">
                    {t('vehicle.search.maxSeats')}
                  </Label>
                  <Input
                    id="maxSeats"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="e.g., 7"
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(e.target.value)}
                    disabled={isLoading}
                    className="h-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('vehicle.search.seatingHint')}
              </p>
            </div>
          )}

          {/* Pagination and Sort Controls */}
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Page Size */}
              <div className="space-y-1.5">
                <Label htmlFor="pageSize" className="text-sm font-medium">
                  {t('vehicle.search.pageSize')}
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
                    <SelectItem value="10">10 {t('vehicle.search.perPage')}</SelectItem>
                    <SelectItem value="20">20 {t('vehicle.search.perPage')}</SelectItem>
                    <SelectItem value="50">50 {t('vehicle.search.perPage')}</SelectItem>
                    <SelectItem value="100">100 {t('vehicle.search.perPage')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Field */}
              <div className="space-y-1.5">
                <Label htmlFor="sortField" className="text-sm font-medium">
                  {t('vehicle.search.sortBy')}
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
                    <SelectItem value="name">{t('vehicle.search.sortName')}</SelectItem>
                    <SelectItem value="make">{t('vehicle.search.sortMake')}</SelectItem>
                    <SelectItem value="model">{t('vehicle.search.sortModel')}</SelectItem>
                    <SelectItem value="year">{t('vehicle.search.sortYear')}</SelectItem>
                    <SelectItem value="status">{t('vehicle.search.sortStatus')}</SelectItem>
                    <SelectItem value="licensePlate">{t('vehicle.search.sortLicensePlate')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Direction */}
              <div className="space-y-1.5">
                <Label htmlFor="sortDirection" className="text-sm font-medium">
                  {t('vehicle.search.sortDirection')}
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
                    <SelectItem value="asc">{t('vehicle.search.ascending')}</SelectItem>
                    <SelectItem value="desc">{t('vehicle.search.descending')}</SelectItem>
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
              {isLoading ? t('vehicle.search.searching') : t('vehicle.search.search')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="h-10 px-6"
            >
              <X className="h-4 w-4 mr-2" />
              {t('vehicle.search.reset')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleSearchFilters;
