'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/api/hooks';
import { formatDate, parseHalResource } from '@/lib/utils';
import type { Package } from '@/types';
import { Box, Download, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function PackagesPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useCollection<Package>('packages', {
    page,
    size: 20,
    sort: 'name,asc',
  });

  const packages = data ? parseHalResource<Package>(data, 'packages') : [];
  const totalPages = data?.page?.totalPages || 0;

  const isPackageActive = (pkg: Package) => {
    if (!pkg.validFrom || !pkg.validTo) return false;
    const now = new Date();
    const validFrom = new Date(pkg.validFrom);
    const validTo = new Date(pkg.validTo);
    return now >= validFrom && now <= validTo;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Packages</h1>
          <p className="text-muted-foreground">
            Manage rental packages and bundles
          </p>
        </div>
        <Link href="/packages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Package
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading packages...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Error loading packages: {error.message}</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No packages found</p>
          <Link href="/packages/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Package
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const selfLink = pkg._links?.self?.href;
              const packageId = selfLink ? selfLink.split('/').pop() : pkg.id;
              
              return (
                <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Box className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{pkg.name || 'Unnamed Package'}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {pkg.minRentalDays ?? 0} days minimum
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        isPackageActive(pkg)
                          ? 'bg-success/20 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isPackageActive(pkg) ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {pkg.description}
                    </p>
                  )}

                  <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">
                        {(pkg.priceModifier ?? 0) > 0 ? '+' : ''}
                        {pkg.priceModifier ?? 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Price Modifier</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valid From:</span>
                      <p className="font-medium">{pkg.validFrom ? formatDate(pkg.validFrom) : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valid To:</span>
                      <p className="font-medium">{pkg.validTo ? formatDate(pkg.validTo) : 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Min. Rental:</span>
                      <p className="font-medium">{pkg.minRentalDays ?? 0} days</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/packages/${packageId}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/packages/${packageId}/edit`} className="flex-1">
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
