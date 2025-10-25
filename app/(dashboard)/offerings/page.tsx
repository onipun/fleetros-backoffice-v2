'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/api/hooks';
import { parseHalResource } from '@/lib/utils';
import type { Offering } from '@/types';
import { Download, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function OfferingsPage() {
  const { t, formatCurrency } = useLocale();
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

  const typeIcons = useMemo(
    () => ({
      GPS: '🗺️',
      INSURANCE: '🛡️',
      CHILD_SEAT: '👶',
      WIFI: '📡',
      ADDITIONAL_DRIVER: '👤',
      OTHER: '📦',
    }),
    []
  );

  const typeLabels = useMemo(
    () => ({
      GPS: t('offering.types.gps'),
      INSURANCE: t('offering.types.insurance'),
      CHILD_SEAT: t('offering.types.childSeat'),
      WIFI: t('offering.types.wifi'),
      ADDITIONAL_DRIVER: t('offering.types.additionalDriver'),
      OTHER: t('offering.types.other'),
    }),
    [t]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('offering.title')}</h1>
          <p className="text-muted-foreground">{t('offering.manage')}</p>
        </div>
        <Link href="/offerings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('offering.addOffering')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('offering.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('offering.searchPlaceholder')}
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
              <option value="">{t('offering.allTypes')}</option>
              <option value="GPS">{typeLabels.GPS}</option>
              <option value="INSURANCE">{typeLabels.INSURANCE}</option>
              <option value="CHILD_SEAT">{typeLabels.CHILD_SEAT}</option>
              <option value="WIFI">{typeLabels.WIFI}</option>
              <option value="ADDITIONAL_DRIVER">{typeLabels.ADDITIONAL_DRIVER}</option>
              <option value="OTHER">{typeLabels.OTHER}</option>
            </select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {t('common.exportCSV')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offerings Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('offering.loading')}</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">
            {`${t('offering.errorMessage')}${error?.message ? ` (${error.message})` : ''}`.trim()}
          </p>
        </div>
      ) : offerings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('offering.noResults')}</p>
          <Link href="/offerings/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t('offering.addFirstOffering')}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offerings.map((offering) => {
              const selfLink = offering._links?.self?.href;
              const offeringId = selfLink ? selfLink.split('/').pop() : offering.id;
              
              return (
                <Card key={offering.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {typeIcons[offering.offeringType || 'OTHER'] || typeIcons.OTHER}
                      </span>
                      <div>
                        <CardTitle className="text-lg">
                          {offering.name || t('offering.unnamedOffering')}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {offering.offeringType
                            ? typeLabels[offering.offeringType as keyof typeof typeLabels] || typeLabels.OTHER
                            : t('common.notAvailable')}
                        </p>
                      </div>
                    </div>
                    {offering.isMandatory && (
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/20 text-primary">
                        {t('offering.mandatory')}
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
                      <span className="text-muted-foreground">{t('offering.priceLabel')}</span>
                      <p className="font-bold text-lg text-primary">
                        {offering.price != null ? formatCurrency(offering.price) : t('common.notAvailable')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('offering.availabilityLabel')}</span>
                      <p className="font-medium">
                        {offering.availability ?? 0} {t('offering.unitsSuffix')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('offering.maxQuantityLabel')}</span>
                      <p className="font-medium">
                        {offering.maxQuantityPerBooking ?? 0} {t('offering.perBookingSuffix')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('offering.statusLabel')}</span>
                      <p className="font-medium">
                        {(offering.availability ?? 0) > 0 ? (
                          <span className="text-success">{t('offering.inStock')}</span>
                        ) : (
                          <span className="text-destructive">{t('offering.outOfStock')}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/offerings/${offeringId}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        {t('common.viewDetails')}
                      </Button>
                    </Link>
                    <Link href={`/offerings/${offeringId}/edit`} className="flex-1">
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
