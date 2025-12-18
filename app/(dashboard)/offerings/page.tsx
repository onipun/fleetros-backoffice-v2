'use client';

import { OfferingSearchFilters } from '@/components/offering/offering-search-filters';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useOfferingSearch } from '@/hooks/use-offering-search';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function OfferingsPage() {
  const { t, formatCurrency } = useLocale();
  const queryClient = useQueryClient();

  // Use offering search hook
  const {
    offerings,
    totalPages,
    currentPage,
    isLoading,
    error,
    search,
    nextPage,
    previousPage,
    refetch,
  } = useOfferingSearch();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (offeringId: number | string) => {
      return hateoasClient.delete('offerings', offeringId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offerings'] });
      await queryClient.invalidateQueries({ queryKey: ['offerings-search'] });
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

      {/* Search Filters */}
      <OfferingSearchFilters
        onSearch={search}
        isLoading={isLoading}
      />

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
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('offering.table.inventoryMode')}</th>
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
                          <td className="px-4 py-3 text-sm text-center">
                            {offering.inventoryMode === 'EXCLUSIVE' ? (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                {t('offering.inventoryMode.exclusive')}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {t('offering.inventoryMode.shared')}
                              </span>
                            )}
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
                onClick={previousPage}
                disabled={currentPage === 0}
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('common.page')} {currentPage + 1} {t('common.of')} {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1}
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
