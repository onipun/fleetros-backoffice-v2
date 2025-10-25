'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagInput } from '@/components/ui/tag-input';
import { usePricingTags } from '@/lib/api/hooks';
import { formatDate } from '@/lib/utils';
import type { Pricing } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, DollarSign, Edit, Filter, Loader2, Tag, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface VehiclePricingListProps {
  vehicleId: string | number;
  onDelete?: (pricingId: number) => void;
  isDeleting?: boolean;
}

interface SearchPricingResponse {
  _embedded?: {
    pricings?: Pricing[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export function VehiclePricingList({ vehicleId, onDelete, isDeleting }: VehiclePricingListProps) {
  const { t, formatCurrency } = useLocale();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 0-based page index
  const PAGE_SIZE = 5;

  // Fetch existing tags for autocomplete
  const { data: existingTags = [] } = usePricingTags();

  // Fetch pricings for this vehicle with optional tag filter
  const { data: pricingsResponse, isLoading, isFetching } = useQuery({
    queryKey: ['vehicle', vehicleId, 'pricings', selectedTags, currentPage],
    queryFn: async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
      
      // Build search URL with filters
      const params = new URLSearchParams({
        vehicleId: String(vehicleId),
        page: String(currentPage),
        size: String(PAGE_SIZE),
        sort: 'validFrom,desc',
      });
      
      // Add tag filter if tags are selected
      if (selectedTags.length > 0) {
        params.append('anyTag', selectedTags.join(','));
      }
      
      const url = `${API_BASE_URL}/api/v1/pricings/search?${params.toString()}`;
      
      // Get access token
      const sessionResponse = await fetch('/api/auth/session');
      let token = null;
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        token = session.accessToken || null;
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, { 
        headers,
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pricings: ${response.status}`);
      }
      
      const data: SearchPricingResponse = await response.json();
      return data;
    },
    enabled: !!vehicleId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const pricings = pricingsResponse?._embedded?.pricings || [];
  const pageInfo = pricingsResponse?.page;
  const totalPages = pageInfo?.totalPages || 0;
  const totalElements = pageInfo?.totalElements || 0;
  const isRefetching = isFetching && !isLoading;

  const handleClearFilters = () => {
    setSelectedTags([]);
    setCurrentPage(0); // Reset to first page
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to first page when filters change
  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    setCurrentPage(0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('vehicle.pricings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('vehicle.pricings')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('common.showing')} {pricings.length} {t('common.of')} {totalElements} {t('pricing.titlePlural')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowFilter(!showFilter);
            }}
            type="button"
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilter ? t('pricing.hideFilter') : t('pricing.filterByTags')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isRefetching && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {/* Filter Section */}
        {showFilter && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('pricing.filterByTags')}</label>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClearFilters();
                    }}
                    type="button"
                    className="h-8 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('common.clear')}
                  </Button>
                )}
              </div>
              <TagInput
                value={selectedTags}
                onChange={handleTagsChange}
                placeholder={t('pricing.selectTags')}
                suggestions={existingTags}
              />
              <p className="text-xs text-muted-foreground">
                {t('pricing.filterDescription')}
              </p>
            </div>
          </div>
        )}

        {/* Pricings List */}
        {pricings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {selectedTags.length > 0
                ? t('vehicle.noPricingsFiltered')
                : t('vehicle.noPricings')}
            </p>
            {selectedTags.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClearFilters();
                }}
                type="button"
                className="mt-3"
              >
                {t('common.clearFilters')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {pricings.map((pricing) => {
              const pricingId = pricing.id || pricing._links?.self?.href?.split('/').pop();
              
              return (
                <div
                  key={pricing.id}
                  className="relative flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Link 
                    href={`/pricings/${pricingId}/edit`}
                    className="absolute inset-0 z-0"
                    aria-label={`Edit pricing ${pricingId}`}
                  />
                  
                  <div className="flex-1 space-y-2 relative z-10 pointer-events-none">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-lg">
                          {formatCurrency(pricing.baseRate ?? 0)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {pricing.rateType || t('common.notAvailable')}
                        </span>
                      </div>
                      {pricing.depositAmount && pricing.depositAmount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {t('pricing.deposit')}: {formatCurrency(pricing.depositAmount)}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {pricing.minimumRentalDays && pricing.minimumRentalDays > 0 && (
                        <div>
                          <span className="text-muted-foreground">{t('pricing.minRental')}:</span>{' '}
                          <span className="font-medium">{pricing.minimumRentalDays} {t('pricing.days')}</span>
                        </div>
                      )}
                      {pricing.validFrom && pricing.validTo && (
                        <div className="flex items-center gap-1 col-span-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatDate(pricing.validFrom)} - {formatDate(pricing.validTo)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Display Tags from API response (tagNames) */}
                    {pricing.tagNames && pricing.tagNames.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {pricing.tagNames.map((tagName, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                          >
                            {tagName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 relative z-10">
                    <Link href={`/pricings/${pricingId}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    {onDelete && pricingId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDelete(Number(pricingId));
                        }}
                        disabled={isDeleting}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {t('common.page')} {currentPage + 1} {t('common.of')} {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePrevPage();
                }}
                disabled={currentPage === 0 || isFetching}
                type="button"
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNextPage();
                }}
                disabled={currentPage >= totalPages - 1 || isFetching}
                type="button"
                className="gap-1"
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
