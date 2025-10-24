import { DeleteDiscountButton } from '@/components/discount/delete-discount-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getServerHateoasClient } from '@/lib/api/server-client';
import { parseHalResource } from '@/lib/utils';
import type { Discount } from '@/types';
import { Edit, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface DiscountsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
}

const PAGE_SIZE = 20;

function extractNumericId(link?: string | null) {
  if (!link) return undefined;
  const segments = link.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const parsed = Number.parseInt(lastSegment ?? '', 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function resolveDiscountId(discount: Discount) {
  return discount.id ?? extractNumericId(discount._links?.self?.href);
}

function formatCurrency(amount?: number | null) {
  if (amount == null) {
    return '-';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDiscountValue(discount: Discount) {
  const value = discount.value ?? 0;

  if (discount.type === 'PERCENTAGE') {
    return `${value.toFixed(2)}%`;
  }

  return formatCurrency(value);
}

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return '-';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusBadgeClasses(status?: string | null) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-success/20 text-success';
    case 'EXPIRED':
      return 'bg-destructive/20 text-destructive';
    case 'INACTIVE':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function resolveTargetEntity(discount: Discount) {
  const scope = discount.applicableScope ?? 'ALL';

  if (scope === 'PACKAGE') {
    const packageId = discount.packageId
      ?? (typeof discount.package === 'string' ? extractNumericId(discount.package) : undefined)
      ?? extractNumericId(discount._links?.package?.href);
    return packageId ? `Package #${packageId}` : 'Package';
  }

  if (scope === 'OFFERING') {
    const offeringId = discount.offeringId
      ?? (typeof discount.offering === 'string' ? extractNumericId(discount.offering) : undefined)
      ?? extractNumericId(discount._links?.offering?.href);
    return offeringId ? `Offering #${offeringId}` : 'Offering';
  }

  if (scope === 'BOOKING') {
    const bookingId = discount.bookingId
      ?? (typeof discount.booking === 'string' ? extractNumericId(discount.booking) : undefined)
      ?? extractNumericId(discount._links?.booking?.href);
    return bookingId ? `Booking #${bookingId}` : 'Bookings';
  }

  return 'All entities';
}

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discounts</h1>
          <p className="text-muted-foreground">Manage promotional codes and scopes</p>
        </div>
        <Link href="/discounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Discount
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search by code or description..."
                defaultValue={rawSearchTerm}
                className="pl-8"
              />
            </div>
            <select
              name="status"
              defaultValue={rawStatusFilter}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="outline">
                Apply Filters
              </Button>
              <Button asChild variant="ghost">
                <Link href="/discounts">Clear</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {filteredDiscounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No discounts found</p>
          <Link href="/discounts/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Discount
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
                      <th className="px-4 py-3 text-left text-sm font-medium">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Type &amp; Value</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Scope</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Valid From</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Valid To</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Min Booking</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Usage</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredDiscounts.map((discount) => {
                      const discountId = resolveDiscountId(discount);
                      const identifier = discountId ? String(discountId) : undefined;

                      return (
                        <tr key={discount.id ?? identifier} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-mono">{discount.code}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">{discount.type}</span>
                              <span className="text-xs text-muted-foreground">{formatDiscountValue(discount)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">{discount.applicableScope}</span>
                              <span className="text-xs text-muted-foreground">{resolveTargetEntity(discount)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadgeClasses(discount.status)}`}>
                              {discount.status ?? 'INACTIVE'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{formatDate(discount.validFrom)}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(discount.validTo)}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(discount.minBookingAmount)}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            {discount.usesCount ?? 0} / {discount.maxUses ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-center gap-2">
                              {identifier ? (
                                <Link href={`/discounts/${identifier}/edit`}>
                                  <Button size="sm" variant="ghost" aria-label={`Edit discount ${discount.code}`}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              ) : null}
                              {identifier ? <DeleteDiscountButton discountId={identifier} /> : null}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                asChild
              >
                <Link
                  href={`/discounts?${new URLSearchParams({
                    ...(rawSearchTerm ? { q: rawSearchTerm } : {}),
                    ...(rawStatusFilter ? { status: rawStatusFilter } : {}),
                    page: String(Math.max(1, currentPage - 1)),
                  }).toString()}`}
                >
                  Previous
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                asChild
              >
                <Link
                  href={`/discounts?${new URLSearchParams({
                    ...(rawSearchTerm ? { q: rawSearchTerm } : {}),
                    ...(rawStatusFilter ? { status: rawStatusFilter } : {}),
                    page: String(Math.min(totalPages, currentPage + 1)),
                  }).toString()}`}
                >
                  Next
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
