'use client';

import { DiscountSearchFilters } from '@/components/discount/discount-search-filters';
import { DiscountsDashboard } from '@/components/discount/discounts-dashboard';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useDiscountSearch } from '@/hooks/use-discount-search';
import { type DiscountSearchParams } from '@/lib/api/discount-search';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

/**
 * Discounts Page Component
 * 
 * Professional discounts management page with:
 * - Advanced search capabilities with multiple modes
 * - Comprehensive filtering by code, type, status, value, scope, validity, features
 * - Real-time search results with pagination
 * - Error handling and loading states
 * - Consistent UI/UX with other search pages
 */
export default function DiscountsPage() {
  const { t } = useLocale();

  // Use discount search hook for state management
  const {
    discounts,
    totalPages,
    totalElements,
    currentPage,
    isLoading,
    error,
    search,
    nextPage,
    previousPage,
    goToPage,
    refetch,
  } = useDiscountSearch({
    initialParams: {
      page: 0,
      size: 20,
      sort: 'code,asc',
    },
  });

  /**
   * Handle search request from filters
   */
  const handleSearch = (params: DiscountSearchParams) => {
    search(params);
  };

  /**
   * Calculate pagination info for display
   */
  const paginationInfo = useMemo(() => {
    const startItem = currentPage * (discounts.length > 0 ? 20 : 0) + 1;
    const endItem = Math.min(startItem + discounts.length - 1, totalElements);
    return { startItem, endItem };
  }, [currentPage, discounts.length, totalElements]);

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <DiscountSearchFilters onSearch={handleSearch} isLoading={isLoading} />
        <ErrorDisplay
          title="Failed to Load Discounts"
          message={error?.message || 'An error occurred while loading discounts. Please try again.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('discount.title')}</h1>
          <p className="text-muted-foreground">{t('discount.manage')}</p>
        </div>
        <Link href="/discounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('discount.createDiscount')}
          </Button>
        </Link>
      </div>

      {/* Search Filters */}
      <DiscountSearchFilters onSearch={handleSearch} isLoading={isLoading} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading discounts...</p>
        </div>
      )}

      {/* Results Display */}
      {!isLoading && (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {paginationInfo.startItem} - {paginationInfo.endItem} of {totalElements} discounts
            </p>
            {totalPages > 0 && (
              <p>
                Page {currentPage + 1} of {totalPages}
              </p>
            )}
          </div>

          {/* Discounts Dashboard */}
          <DiscountsDashboard
            discounts={discounts}
            currentPage={currentPage + 1}
            totalPages={totalPages}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={previousPage}
                disabled={currentPage === 0 || isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (currentPage < 3) {
                    pageNum = i;
                  } else if (currentPage > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      disabled={isLoading}
                      className={`w-10 h-10 text-sm font-medium rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1 || isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
