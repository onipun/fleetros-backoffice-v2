'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const vehicles = data ? parseHalResource<Vehicle>(data, 'vehicles') : [];
  const totalPages = data?.page?.totalPages || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your fleet of vehicles
          </p>
        </div>
        <Link href="/vehicles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
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
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Rented</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      {isLoading ? (
        <VehicleListSkeleton />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Error loading vehicles: {error.message}</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No vehicles found</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Vehicle
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {vehicles.map((vehicle) => {
              const selfLink = vehicle._links?.self?.href;
              const vehicleId = selfLink ? selfLink.split('/').pop() : vehicle.id;
              
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
                        <CardTitle className="text-lg truncate">{vehicle.name || 'Unnamed Vehicle'}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">
                          {vehicle.make || 'Unknown'} {vehicle.model || 'Model'} ({vehicle.year || 'N/A'})
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
                        {vehicle.status || 'UNKNOWN'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">License Plate:</span>
                        <p className="font-medium truncate">{vehicle.licensePlate || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Fuel Type:</span>
                        <p className="font-medium truncate">{vehicle.fuelType || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Transmission:</span>
                        <p className="font-medium truncate">{vehicle.transmissionType || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Odometer:</span>
                        <p className="font-medium truncate">
                          {vehicle.odometer != null ? vehicle.odometer.toLocaleString() : 'N/A'} km
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Link href={`/vehicles/${vehicleId}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/vehicles/${vehicleId}/edit`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          Edit
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
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
