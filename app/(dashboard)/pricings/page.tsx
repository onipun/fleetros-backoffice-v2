import { DeletePricingButton } from '@/components/pricing/delete-pricing-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getServerHateoasClient } from '@/lib/api/server-client';
import { parseHalResource } from '@/lib/utils';
import type { Pricing } from '@/types';
import { Edit, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface PricingsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

function extractIdFromLink(link?: string) {
  if (!link) return undefined;
  const segments = link.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const parsedId = Number.parseInt(lastSegment ?? '', 10);
  return Number.isNaN(parsedId) ? undefined : parsedId;
}

function getEntityInfo(pricing: Pricing) {
  const vehicleId = pricing.vehicleId ?? extractIdFromLink(pricing._links?.vehicle?.href);
  if (vehicleId) return { type: 'Vehicle', id: vehicleId };

  const packageId = pricing.packageId ?? extractIdFromLink(pricing._links?.package?.href);
  if (packageId) return { type: 'Package', id: packageId };

  const bookingId = pricing.bookingId ?? extractIdFromLink(pricing._links?.booking?.href);
  if (bookingId) return { type: 'Booking', id: bookingId };

  return { type: 'Unknown', id: '-' };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';

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

const PAGE_SIZE = 20;

export default async function PricingsPage({ searchParams }: PricingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const pageParam = Number(resolvedSearchParams?.page ?? '1');
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const queryPage = currentPage - 1; // API is zero-based
  const rawSearchTerm = resolvedSearchParams?.q?.trim() ?? '';
  const normalizedSearchTerm = rawSearchTerm.toLowerCase();

  const client = getServerHateoasClient();
  let data;

  try {
    data = await client.getCollection<Pricing>('pricings', {
      page: queryPage,
      size: PAGE_SIZE,
      sort: 'validFrom,desc',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      redirect('/login?error=session_expired');
    }
    throw error;
  }

  const pricings = parseHalResource<Pricing>(data, 'pricings');
  const filteredPricings = normalizedSearchTerm
    ? pricings.filter((pricing) => pricing.rateType?.toLowerCase().includes(normalizedSearchTerm))
    : pricings;
  const totalPages = data?.page?.totalPages ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricings</h1>
          <p className="text-muted-foreground">
            Manage pricing configurations for vehicles, packages, and bookings
          </p>
        </div>
        <Link href="/pricings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Pricing
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" action="" method="get">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search by rate type..."
                defaultValue={rawSearchTerm}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="outline">
                Apply Filters
              </Button>
              <Button asChild variant="ghost">
                <Link href="/pricings">Clear</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {filteredPricings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No pricings found</p>
          <Link href="/pricings/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Pricing
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
                      <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Entity</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Rate Type</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Base Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Deposit</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Min Days</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Valid From</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Valid To</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPricings.map((pricing) => {
                      const selfLink = pricing._links?.self?.href;
                      const pricingId = selfLink ? selfLink.split('/').pop() : pricing.id;
                      const pricingIdentifier = pricingId ? String(pricingId) : String(pricing.id);
                      const entity = getEntityInfo(pricing);

                      return (
                        <tr key={pricing.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">{pricing.id}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">{entity.type}</span>
                              <span className="text-xs text-muted-foreground">ID: {entity.id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                              {pricing.rateType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {formatCurrency(pricing.baseRate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {formatCurrency(pricing.depositAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {pricing.minimumRentalDays}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatDate(pricing.validFrom)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatDate(pricing.validTo)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <Link href={`/pricings/${pricingIdentifier}/edit`}>
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <DeletePricingButton pricingId={pricingIdentifier} />
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
                  href={`/pricings?${new URLSearchParams({
                    ...(rawSearchTerm ? { q: rawSearchTerm } : {}),
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
                  href={`/pricings?${new URLSearchParams({
                    ...(rawSearchTerm ? { q: rawSearchTerm } : {}),
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
