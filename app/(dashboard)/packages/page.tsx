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
      return <span className="text-muted-foreground text-xs">{t('common.none')}</span>;
    }

    const displayOfferings = offerings.length > 0 ? offerings : (pkg.offerings || []);

    return (
      <div className="flex flex-wrap gap-1">
        {displayOfferings.slice(0, 3).map((offering) => (
          <span
            key={offering.id ?? offering.name}
            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {offering?.name || `${t('package.offeringFallback')} #${offering?.id ?? t('common.notAvailable')}`}
          </span>
        ))}
        {displayOfferings.length > 3 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            +{displayOfferings.length - 3}
          </span>
        )}
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

      {/* Packages Table */}
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
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('package.table.name')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('package.table.priceModifier')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('package.table.minRentalDays')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('package.table.validFrom')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('package.table.validTo')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('package.table.offerings')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('package.table.status')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('package.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {packages.map((pkg) => {
                      const selfLink = pkg._links?.self?.href;
                      const packageId = selfLink ? selfLink.split('/').pop() : pkg.id;
                      
                      return (
                        <tr key={pkg.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-primary shrink-0" />
                              <div className="flex flex-col">
                                <span className="font-medium">{pkg.name || t('package.unnamedPackage')}</span>
                                {pkg.description && (
                                  <span className="text-xs text-muted-foreground line-clamp-1">
                                    {pkg.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-primary">
                            {(pkg.priceModifier ?? 0) > 0 ? '+' : ''}
                            {pkg.priceModifier ?? 0}%
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {pkg.minRentalDays ?? 0} {t('package.daysSuffix')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {pkg.validFrom ? formatDate(pkg.validFrom, locale) : t('common.notAvailable')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {pkg.validTo ? formatDate(pkg.validTo, locale) : t('common.notAvailable')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <PackageOfferings pkg={pkg} />
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium ${
                                isPackageActive(pkg)
                                  ? 'bg-success/20 text-success'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isPackageActive(pkg) ? t('package.active') : t('package.inactive')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <Link href={`/packages/${packageId}/edit`}>
                                <Button size="sm" variant="ghost">
                                  {t('common.edit')}
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

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
