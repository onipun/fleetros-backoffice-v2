'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { useCustomerSpendingSearch } from '@/hooks/use-customer-spending-search';
import { Users } from 'lucide-react';
import { CustomerSpendingSearchFilters } from './customer-spending-search-filters';
import { CustomerSpendingTable } from './customer-spending-table';

/**
 * Customer Spending Viewer Component
 * 
 * Main component that combines search filters and results table for customer spending summaries.
 * Provides a complete interface for viewing and analyzing customer spending data.
 * 
 * Features:
 * - Multiple search modes (by ID, email, name, min spend, filters)
 * - Real-time search with pagination
 * - Sortable results
 * - Responsive design
 */
export function CustomerSpendingViewer() {
  const { t } = useLocale();
  
  const {
    summaries,
    totalPages,
    totalElements,
    currentPage,
    isLoading,
    search,
    nextPage,
    previousPage,
    goToPage,
  } = useCustomerSpendingSearch();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">
            {t('customerSpending.title') || 'Customer Spending Summary'}
          </h2>
        </div>
        <p className="text-muted-foreground">
          {t('customerSpending.description') || 'View aggregated financial metrics and booking statistics for your customers'}
        </p>
      </div>

      {/* Search Filters */}
      <CustomerSpendingSearchFilters
        onSearch={search}
        isLoading={isLoading}
      />

      {/* Results Table */}
      <CustomerSpendingTable
        summaries={summaries}
        totalPages={totalPages}
        totalElements={totalElements}
        currentPage={currentPage}
        isLoading={isLoading}
        onNextPage={nextPage}
        onPreviousPage={previousPage}
        onGoToPage={goToPage}
      />
    </div>
  );
}

export default CustomerSpendingViewer;
