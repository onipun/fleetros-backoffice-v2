'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { useCollection } from '@/lib/api/hooks';
import { parseHalResource } from '@/lib/utils';
import type { Offering } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function OfferingsPage() {
  const { t, formatCurrency } = useLocale();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data, isLoading, error, refetch } = useCollection<Offering>('offerings', {
    page,
    size: 20,
    sort: 'name,asc',
  });

  const offerings = data ? parseHalResource<Offering>(data, 'offerings') : [];
  const totalPages = data?.page?.totalPages || 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (offeringId: number | string) => {
      return hateoasClient.delete('offerings', offeringId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offerings'] });
      toast({
        title: t('common.success'),
        description: 'Offering deleted successfully',
      });
      await refetch();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (offeringId: number | string, offeringName: string) => {
    if (confirm(`Are you sure you want to delete "${offeringName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(offeringId);
    }
  };

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

      {/* Offerings Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('offering.loading')}</p>
        </div>
      ) : error ? (
        <Card>
          <ErrorDisplay
            title={t('offering.errorTitle')}
            message={`${t('offering.errorMessage')}${error?.message ? ` (${error.message})` : ''}`.trim()}
            onRetry={() => refetch()}
          />
        </Card>
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
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('offering.table.name')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('offering.table.type')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">{t('offering.table.price')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('offering.table.availability')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('offering.table.maxQuantity')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('offering.table.mandatory')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('offering.table.status')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('offering.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {offerings.map((offering) => {
                      const selfLink = offering._links?.self?.href;
                      const offeringId = selfLink ? selfLink.split('/').pop() : offering.id;
                      
                      return (
                        <tr key={offering.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {typeIcons[offering.offeringType || 'OTHER'] || typeIcons.OTHER}
                              </span>
                              <div className="flex flex-col">
                                <span className="font-medium">{offering.name || t('offering.unnamedOffering')}</span>
                                {offering.description && (
                                  <span className="text-xs text-muted-foreground line-clamp-1">
                                    {offering.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {offering.offeringType
                              ? typeLabels[offering.offeringType as keyof typeof typeLabels] || typeLabels.OTHER
                              : t('common.notAvailable')}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-primary">
                            {offering.price != null ? formatCurrency(offering.price) : t('common.notAvailable')}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {offering.availability ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {offering.maxQuantityPerBooking ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {offering.isMandatory ? (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary/20 text-primary">
                                {t('offering.yes')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">{t('offering.no')}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {(offering.availability ?? 0) > 0 ? (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-success/20 text-success">
                                {t('offering.inStock')}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-destructive/20 text-destructive">
                                {t('offering.outOfStock')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <Link href={`/offerings/${offeringId}`}>
                                <Button size="sm" variant="ghost">
                                  {t('common.view')}
                                </Button>
                              </Link>
                              <Link href={`/offerings/${offeringId}/edit`}>
                                <Button size="sm" variant="ghost">
                                  {t('common.edit')}
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDelete(offeringId!, offering.name || 'Unnamed Offering')}
                                disabled={deleteMutation.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
