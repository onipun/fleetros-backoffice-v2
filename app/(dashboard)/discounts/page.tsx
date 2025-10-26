'use client';

import { DiscountsDashboard } from '@/components/discount/discounts-dashboard';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useCollection } from '@/lib/api/hooks';
import { parseHalResource } from '@/lib/utils';
import type { Discount } from '@/types';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

const PAGE_SIZE = 20;

export default function DiscountsPage() {
  const searchParams = useSearchParams();
  const rawPage = Number(searchParams?.get('page') ?? '1');
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const apiPage = currentPage - 1;
  const rawSearchTerm = searchParams?.get('q')?.trim() ?? '';
  const normalizedSearchTerm = rawSearchTerm.toLowerCase();
  const rawStatusFilter = searchParams?.get('status')?.trim().toUpperCase() ?? '';

  const { data, isLoading, error, refetch } = useCollection<Discount>('discounts', {
    page: apiPage,
    size: PAGE_SIZE,
    sort: 'validFrom,desc',
  });

  const discounts = useMemo(() => {
    if (!data) return [];
    return parseHalResource<Discount>(data, 'discounts');
  }, [data]);

  const filteredDiscounts = useMemo(() => {
    return discounts.filter((discount) => {
      const matchesSearch = normalizedSearchTerm
        ? discount.code?.toLowerCase().includes(normalizedSearchTerm)
          || discount.description?.toLowerCase().includes(normalizedSearchTerm)
        : true;

      const matchesStatus = rawStatusFilter
        ? discount.status?.toUpperCase() === rawStatusFilter
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [discounts, normalizedSearchTerm, rawStatusFilter]);

  const totalPages = data?.page?.totalPages ?? 0;

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to Load Discounts"
        message={error?.message || 'An error occurred while loading discounts. Please try again.'}
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading discounts...</p>
      </div>
    );
  }

  return (
    <DiscountsDashboard
      discounts={filteredDiscounts}
      currentPage={currentPage}
      totalPages={totalPages}
      searchTerm={rawSearchTerm}
      statusFilter={rawStatusFilter}
    />
  );
}
