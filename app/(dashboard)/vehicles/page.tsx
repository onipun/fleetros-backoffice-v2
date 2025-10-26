'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Input } from '@/components/ui/input';
import { VehicleImage } from '@/components/vehicle/vehicle-image';
import { VehicleListSkeleton } from '@/components/vehicle/vehicle-skeletons';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { useCollection } from '@/lib/api/hooks';
import { parseHalResource } from '@/lib/utils';
import type { HATEOASCollection, Vehicle } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function VehiclesPage() {
  const { t } = useLocale();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when status filter changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  // Determine which query to use based on filters
  const shouldUseSearch = Boolean(debouncedSearchTerm || statusFilter);

  // Fetch using search endpoint when filters are active
  const searchQuery = useQuery({
    queryKey: ['vehicles', 'search', debouncedSearchTerm, statusFilter, page],
    queryFn: async () => {
      if (statusFilter && debouncedSearchTerm) {
        // Search by both status and name
        return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndNameContainingIgnoreCase', {
          status: statusFilter,
          name: debouncedSearchTerm,
          page,
          size: 20,
          sort: 'name,asc',
        });
      } else if (statusFilter) {
        // Search by status only
        return hateoasClient.search<Vehicle>('vehicles', 'findByStatus', {
          status: statusFilter,
          page,
          size: 20,
          sort: 'name,asc',
        });
      } else if (debouncedSearchTerm) {
        // Search by name only
        return hateoasClient.search<Vehicle>('vehicles', 'findByNameContainingIgnoreCase', {
          name: debouncedSearchTerm,
          page,
          size: 20,
          sort: 'name,asc',
        });
      }
      return { _embedded: {}, _links: {}, page: { size: 0, totalElements: 0, totalPages: 0, number: 0 } } as HATEOASCollection<Vehicle>;
    },
    enabled: shouldUseSearch,
  });

  // Fetch all vehicles when no filters
  const allVehiclesQuery = useCollection<Vehicle>('vehicles', {
    page,
    size: 20,
    sort: 'name,asc',
  });

  // Use appropriate query based on filter state
  const { data, isLoading, error } = shouldUseSearch ? searchQuery : allVehiclesQuery;
  const refetch = shouldUseSearch ? searchQuery.refetch : allVehiclesQuery.refetch;

  const vehicles = data ? parseHalResource<Vehicle>(data, 'vehicles') : [];
  const totalPages = data?.page?.totalPages || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('vehicle.title')}</h1>
          <p className="text-muted-foreground">
            {t('vehicle.manageFleet')}
          </p>
        </div>
        <Link href="/vehicles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('vehicle.addVehicle')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('vehicle.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('vehicle.searchByName')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('vehicle.allStatuses')}</option>
              <option value="AVAILABLE">{t('vehicle.available')}</option>
              <option value="RENTED">{t('vehicle.rented')}</option>
              <option value="MAINTENANCE">{t('vehicle.maintenance')}</option>
              <option value="RETIRED">{t('vehicle.retired')}</option>
            </select>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPage(0);
              }}
            >
              {t('common.clearFilters')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      {isLoading ? (
        <VehicleListSkeleton />
      ) : error ? (
        <Card>
          <ErrorDisplay
            title={t('vehicle.errorTitle')}
            message={`${t('vehicle.errorLoading')}${error?.message ? `: ${error.message}` : ''}`.trim()}
            onRetry={() => refetch()}
          />
        </Card>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('vehicle.noVehiclesFound')}</p>
          <Link href="/vehicles/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t('vehicle.addVehicle')}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {vehicles.map((vehicle) => {
              const selfLink = vehicle._links?.self?.href;
              const vehicleId = selfLink ? selfLink.split('/').pop() : vehicle.id;
              const normalizedStatus = vehicle.status?.toLowerCase();
              const statusLabel = normalizedStatus && ['available', 'rented', 'maintenance', 'retired'].includes(normalizedStatus)
                ? t(`vehicle.${normalizedStatus}`)
                : vehicle.status || t('vehicle.unknownStatus');
              
              return (
                <Card key={vehicle.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Vehicle Image */}
                  <Link href={`/vehicles/${vehicleId}`}>
                    <VehicleImage
                      src={vehicle.primaryImageUrl}
                      alt={`${vehicle.name || 'Vehicle'} - ${vehicle.make || ''} ${vehicle.model || ''}`}
                      className="w-full h-48 sm:h-56 md:h-48 lg:h-52 xl:h-48 cursor-pointer hover:opacity-90 transition-opacity"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    />
                  </Link>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{vehicle.name || t('vehicle.unnamedVehicle')}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">
                          {vehicle.make || t('vehicle.unknownModel')} {vehicle.model || t('vehicle.unknownModel')} ({vehicle.year || t('common.notAvailable')})
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ml-2 ${
                          vehicle.status === 'AVAILABLE'
                            ? 'bg-success/20 text-success'
                            : vehicle.status === 'RENTED'
                            ? 'bg-info/20 text-info'
                            : vehicle.status === 'MAINTENANCE'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">{t('vehicle.licensePlate')}:</span>
                        <p className="font-medium truncate">{vehicle.licensePlate || t('common.notAvailable')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">{t('vehicle.fuelType')}:</span>
                        <p className="font-medium truncate">{vehicle.fuelType || t('common.notAvailable')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">{t('vehicle.transmissionType')}:</span>
                        <p className="font-medium truncate">{vehicle.transmissionType || t('common.notAvailable')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">{t('vehicle.odometer')}:</span>
                        <p className="font-medium truncate">
                          {vehicle.odometer != null ? vehicle.odometer.toLocaleString() : t('common.notAvailable')} {t('vehicle.kilometersShort')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Link href={`/vehicles/${vehicleId}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          {t('common.viewDetails')}
                        </Button>
                      </Link>
                      <Link href={`/vehicles/${vehicleId}/edit`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          {t('common.edit')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('common.page')} {page + 1} {t('common.of')} {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
