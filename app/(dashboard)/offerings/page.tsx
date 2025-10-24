'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/api/hooks';
import { formatCurrency, parseHalResource } from '@/lib/utils';
import type { Offering } from '@/types';
import { Download, Plus, Search } from 'lucide-react';
import { useState } from 'react';

export default function OfferingsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data, isLoading, error } = useCollection<Offering>('offerings', {
    page,
    size: 20,
    sort: 'name,asc',
  });

  const offerings = data ? parseHalResource<Offering>(data, 'offerings') : [];
  const totalPages = data?.page?.totalPages || 0;

  const getOfferingTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      GPS: '🗺️',
      INSURANCE: '🛡️',
      CHILD_SEAT: '👶',
      WIFI: '📡',
      ADDITIONAL_DRIVER: '👤',
      OTHER: '📦',
    };
    return icons[type] || '📦';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offerings</h1>
          <p className="text-muted-foreground">
            Manage additional services and add-ons
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Offering
        </Button>
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
                placeholder="Search offerings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="GPS">GPS</option>
              <option value="INSURANCE">Insurance</option>
              <option value="CHILD_SEAT">Child Seat</option>
              <option value="WIFI">WiFi</option>
              <option value="ADDITIONAL_DRIVER">Additional Driver</option>
              <option value="OTHER">Other</option>
            </select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offerings Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading offerings...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Error loading offerings: {error.message}</p>
        </div>
      ) : offerings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No offerings found</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Offering
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offerings.map((offering) => (
              <Card key={offering.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getOfferingTypeIcon(offering.offeringType || 'OTHER')}
                      </span>
                      <div>
                        <CardTitle className="text-lg">{offering.name || 'Unnamed Offering'}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {offering.offeringType ? offering.offeringType.replace('_', ' ') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {offering.isMandatory && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/20 text-primary">
                        Mandatory
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {offering.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {offering.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-bold text-lg text-primary">
                        {offering.price != null ? formatCurrency(offering.price) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Availability:</span>
                      <p className="font-medium">{offering.availability ?? 0} units</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Quantity:</span>
                      <p className="font-medium">
                        {offering.maxQuantityPerBooking ?? 0} per booking
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-medium">
                        {(offering.availability ?? 0) > 0 ? (
                          <span className="text-success">In Stock</span>
                        ) : (
                          <span className="text-destructive">Out of Stock</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
