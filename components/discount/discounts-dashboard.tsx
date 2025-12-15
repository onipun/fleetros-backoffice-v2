'use client';

import { DeleteDiscountButton } from '@/components/discount/delete-discount-button';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Discount } from '@/types';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

interface DiscountsDashboardProps {
  discounts: Discount[];
  currentPage: number;
  totalPages: number;
}

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

function formatDiscountValue(discount: Discount, formatCurrency: (amount: number) => string, percentageSuffix: string) {
  const value = discount.value ?? 0;

  if (discount.type === 'PERCENTAGE') {
    return `${value.toFixed(2)}${percentageSuffix}`;
  }

  return formatCurrency(value);
}

function resolveTargetEntity(discount: Discount, t: (key: string) => string) {
  const scope = discount.applicableScope ?? 'ALL';

  if (scope === 'PACKAGE') {
    // Check for multiple packages (new API format)
    const packageIds = discount.applicablePackageIds;
    if (packageIds && packageIds.length > 0) {
      return packageIds.length === 1 
        ? `${t('discount.scope.package')} #${packageIds[0]}`
        : `${packageIds.length} ${t('discount.scope.package')}s`;
    }
    // Fallback to single package ID (legacy format)
    const packageId = discount.packageId
      ?? (typeof discount.package === 'string' ? extractNumericId(discount.package) : undefined)
      ?? extractNumericId(discount._links?.package?.href);
    return packageId ? `${t('discount.scope.package')} #${packageId}` : t('discount.scope.package');
  }

  if (scope === 'OFFERING') {
    // Check for multiple offerings (new API format)
    const offeringIds = discount.applicableOfferingIds;
    if (offeringIds && offeringIds.length > 0) {
      return offeringIds.length === 1
        ? `${t('discount.scope.offering')} #${offeringIds[0]}`
        : `${offeringIds.length} ${t('discount.scope.offering')}s`;
    }
    // Fallback to single offering ID (legacy format)
    const offeringId = discount.offeringId
      ?? (typeof discount.offering === 'string' ? extractNumericId(discount.offering) : undefined)
      ?? extractNumericId(discount._links?.offering?.href);
    return offeringId ? `${t('discount.scope.offering')} #${offeringId}` : t('discount.scope.offering');
  }

  if (scope === 'BOOKING') {
    const bookingId = discount.bookingId
      ?? (typeof discount.booking === 'string' ? extractNumericId(discount.booking) : undefined)
      ?? extractNumericId(discount._links?.booking?.href);
    return bookingId ? `${t('discount.scope.booking')} #${bookingId}` : t('discount.scope.booking');
  }

  if (scope === 'VEHICLE') {
    return t('discount.scope.vehicle');
  }

  return t('discount.scope.all');
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

export function DiscountsDashboard({
  discounts,
  currentPage,
  totalPages,
}: DiscountsDashboardProps) {
  const { t, formatCurrency, locale } = useLocale();

  const statusLabels = useMemo(
    () => ({
      ACTIVE: t('discount.status.active'),
      INACTIVE: t('discount.status.inactive'),
      EXPIRED: t('discount.status.expired'),
    }),
    [t]
  );

  const typeLabels = useMemo(
    () => ({
      PERCENTAGE: t('discount.type.percentage'),
      FIXED: t('discount.type.fixed'),
      FIXED_AMOUNT: t('discount.type.fixed_amount'),
      FLAT: t('discount.type.fixed'),
      AMOUNT: t('discount.type.fixed'),
    }),
    [t]
  );

  const percentageSuffix = t('discount.percentageSuffix');

  const buildPageLink = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    return `/discounts?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      {discounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('discount.noResults')}</p>
          <Link href="/discounts/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t('discount.createFirstDiscount')}
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
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('discount.table.code')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('discount.table.type')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('discount.table.scope')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('discount.table.status')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Flags</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('discount.table.validFrom')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('discount.table.validTo')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">{t('discount.table.minBooking')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('discount.table.usage')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('discount.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {discounts.map((discount) => {
                      const discountId = resolveDiscountId(discount);
                      const identifier = discountId ? String(discountId) : undefined;
                      const typeKey = (discount.type ?? '') as keyof typeof typeLabels;
                      const statusLabel = statusLabels[(discount.status ?? '') as keyof typeof statusLabels];

                      return (
                        <tr key={discount.id ?? identifier} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-mono">{discount.code ?? t('common.notAvailable')}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {typeLabels[typeKey] ?? discount.type ?? t('discount.type.unknown')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDiscountValue(discount, formatCurrency, percentageSuffix)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {discount.applicableScope
                                  ? t(`discount.scope.${discount.applicableScope.toLowerCase()}`)
                                  : t('discount.scope.all')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {resolveTargetEntity(discount, t)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadgeClasses(discount.status)}`}>
                              {statusLabel ?? t('discount.status.unknown')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {discount.autoApply && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" title="Auto-apply enabled">
                                  Auto
                                </span>
                              )}
                              {discount.requiresPromoCode && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" title="Requires promo code">
                                  Code
                                </span>
                              )}
                              {discount.combinableWithOtherDiscounts && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" title="Can be combined">
                                  +
                                </span>
                              )}
                              {discount.firstTimeCustomerOnly && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" title="First-time customers only">
                                  1st
                                </span>
                              )}
                              {discount.priority != null && discount.priority > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" title={`Priority: ${discount.priority}`}>
                                  P{discount.priority}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {discount.validFrom
                              ? formatDate(discount.validFrom, locale)
                              : t('common.notAvailable')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {discount.validTo
                              ? formatDate(discount.validTo, locale)
                              : t('common.notAvailable')}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {discount.minBookingAmount != null
                              ? formatCurrency(discount.minBookingAmount)
                              : t('common.notAvailable')}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {discount.usesCount ?? 0} / {discount.maxUses ?? 0}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-center gap-2">
                              {identifier ? (
                                <Link href={`/discounts/${identifier}/edit`}>
                                  <Button size="sm" variant="ghost">
                                    {t('common.edit')}
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
              <Button variant="outline" disabled={currentPage <= 1} asChild>
                <Link href={buildPageLink(Math.max(1, currentPage - 1))}>
                  {t('common.previous')}
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('common.page')} {currentPage} {t('common.of')} {totalPages}
              </span>
              <Button variant="outline" disabled={currentPage >= totalPages} asChild>
                <Link href={buildPageLink(Math.min(totalPages, currentPage + 1))}>
                  {t('common.next')}
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
