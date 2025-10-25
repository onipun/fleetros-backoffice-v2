import { DiscountsDashboard } from '@/components/discount/discounts-dashboard';
import { getServerHateoasClient } from '@/lib/api/server-client';
import { parseHalResource } from '@/lib/utils';
import type { Discount } from '@/types';
import { redirect } from 'next/navigation';

interface DiscountsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function DiscountsPage({ searchParams }: DiscountsPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawPage = Number(resolvedSearchParams?.page ?? '1');
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const apiPage = currentPage - 1;
  const rawSearchTerm = resolvedSearchParams?.q?.trim() ?? '';
  const normalizedSearchTerm = rawSearchTerm.toLowerCase();
  const rawStatusFilter = resolvedSearchParams?.status?.trim().toUpperCase() ?? '';

  const client = getServerHateoasClient();
  let data;

  try {
    data = await client.getCollection<Discount>('discounts', {
      page: apiPage,
      size: PAGE_SIZE,
      sort: 'validFrom,desc',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      redirect('/login?error=session_expired');
    }
    throw error;
  }

  const discounts = parseHalResource<Discount>(data, 'discounts');
  const filteredDiscounts = discounts.filter((discount) => {
    const matchesSearch = normalizedSearchTerm
      ? discount.code?.toLowerCase().includes(normalizedSearchTerm)
        || discount.description?.toLowerCase().includes(normalizedSearchTerm)
      : true;

    const matchesStatus = rawStatusFilter
      ? discount.status?.toUpperCase() === rawStatusFilter
      : true;

    return matchesSearch && matchesStatus;
  });

  const totalPages = data?.page?.totalPages ?? 0;

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
