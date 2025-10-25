'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { useCollection } from '@/lib/api/hooks';
import { formatDate, parseHalResource } from '@/lib/utils';
import type { HATEOASCollection, Offering, Package } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Box, Download, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function PackagesPage() {
  const { t, locale } = useLocale();
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

  // Component to fetch and display offerings for a single package
  const PackageOfferings = ({ pkg }: { pkg: Package }) => {
    const offeringsLink = pkg._links?.offerings?.href;
    
    const { data: offeringsData } = useQuery({
      queryKey: ['package', pkg.id, 'offerings'],
      queryFn: async () => {
        if (!offeringsLink) return null;
        return hateoasClient.followLink<HATEOASCollection<Offering>>(offeringsLink);
      },
      enabled: Boolean(offeringsLink),
      staleTime: 60000, // Cache for 1 minute
    });

    const offerings = offeringsData ? parseHalResource<Offering>(offeringsData, 'offerings') : [];

    if (offerings.length === 0 && !pkg.offerings?.length) {
      return null;
    }

    const displayOfferings = offerings.length > 0 ? offerings : (pkg.offerings || []);

    return (
      <div className="space-y-2 text-sm">
        <span className="text-muted-foreground">{t('package.includedOfferings')}</span>
        <div className="flex flex-wrap gap-2">
          {displayOfferings.map((offering) => (
            <span
              key={offering.id ?? offering.name}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {offering?.name || `${t('package.offeringFallback')} #${offering?.id ?? t('common.notAvailable')}`}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('package.title')}</h1>
          <p className="text-muted-foreground">{t('package.manage')}</p>
        </div>
        <Link href="/packages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('package.createPackage')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('package.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('package.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {t('common.exportCSV')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('package.loading')}</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">
            {`${t('package.errorMessage')}${error?.message ? ` (${error.message})` : ''}`.trim()}
          </p>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('package.noResults')}</p>
          <Link href="/packages/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t('package.createFirstPackage')}
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
                        <CardTitle className="text-lg">
                          {pkg.name || t('package.unnamedPackage')}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {pkg.minRentalDays ?? 0} {t('package.minimumDaysSuffix')}
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
                      {isPackageActive(pkg) ? t('package.active') : t('package.inactive')}
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
                      <p className="text-xs text-muted-foreground">{t('package.priceModifierLabel')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('package.validFromLabel')}</span>
                      <p className="font-medium">
                        {pkg.validFrom ? formatDate(pkg.validFrom, locale) : t('common.notAvailable')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('package.validToLabel')}</span>
                      <p className="font-medium">
                        {pkg.validTo ? formatDate(pkg.validTo, locale) : t('common.notAvailable')}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">{t('package.minRentalLabel')}</span>
                      <p className="font-medium">
                        {pkg.minRentalDays ?? 0} {t('package.daysSuffix')}
                      </p>
                    </div>
                  </div>

                  <PackageOfferings pkg={pkg} />

                  <div className="flex gap-2 pt-2">
                    <Link href={`/packages/${packageId}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        {t('common.viewDetails')}
                      </Button>
                    </Link>
                    <Link href={`/packages/${packageId}/edit`} className="flex-1">
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
