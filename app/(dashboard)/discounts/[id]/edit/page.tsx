'use client';

import { DiscountForm, type DiscountFormState } from '@/components/discount/discount-form';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Discount } from '@/types';
import { DiscountStatus as DiscountStatusEnum, DiscountType as DiscountTypeEnum } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

function extractNumericId(link?: string | null) {
  if (!link) {
    return undefined;
  }

  const segments = link.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const parsed = Number.parseInt(lastSegment ?? '', 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getTargetEntityId(discount: Discount) {
  switch (discount.applicableScope) {
    case 'PACKAGE':
      return discount.packageId
        ?? (typeof discount.package === 'string' ? extractNumericId(discount.package) : undefined)
        ?? extractNumericId(discount._links?.package?.href);
    case 'OFFERING':
      return discount.offeringId
        ?? (typeof discount.offering === 'string' ? extractNumericId(discount.offering) : undefined)
        ?? extractNumericId(discount._links?.offering?.href);
    case 'BOOKING':
      return discount.bookingId
        ?? (typeof discount.booking === 'string' ? extractNumericId(discount.booking) : undefined)
        ?? extractNumericId(discount._links?.booking?.href);
    default:
      return undefined;
  }
}

function mapDiscountToFormState(discount: Discount): DiscountFormState {
  return {
    code: discount.code ?? '',
    type: discount.type ?? DiscountTypeEnum.PERCENTAGE,
    value: discount.value ?? 0,
    validFrom: discount.validFrom ?? '',
    validTo: discount.validTo ?? '',
    minBookingAmount: discount.minBookingAmount ?? 0,
    maxUses: discount.maxUses ?? 1,
    usesCount: discount.usesCount ?? 0,
    applicableScope: discount.applicableScope ?? 'ALL',
    description: discount.description ?? '',
    status: discount.status ?? DiscountStatusEnum.INACTIVE,
    targetEntityId: getTargetEntityId(discount),
  };
}

function buildDiscountPayload(values: DiscountFormState) {
  const payload: Record<string, unknown> = {
    code: values.code.trim(),
    type: values.type,
    value: values.value,
    validFrom: values.validFrom,
    validTo: values.validTo,
    minBookingAmount: values.minBookingAmount,
    maxUses: values.maxUses,
    applicableScope: values.applicableScope,
    description: values.description,
    status: values.status,
  };

  if (values.applicableScope === 'PACKAGE' && values.targetEntityId) {
    payload.package = `/api/packages/${values.targetEntityId}`;
  }

  if (values.applicableScope === 'OFFERING' && values.targetEntityId) {
    payload.offering = `/api/offerings/${values.targetEntityId}`;
  }

  if (values.applicableScope === 'BOOKING' && values.targetEntityId) {
    payload.booking = `/api/bookings/${values.targetEntityId}`;
  }

  return payload;
}

export default function EditDiscountPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const discountId = params.id as string;

  const {
    data: discount,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['discount', discountId],
    queryFn: async () => hateoasClient.getResource<Discount>('discounts', discountId),
  });

  const initialData = useMemo(() => (discount ? mapDiscountToFormState(discount) : undefined), [discount]);

  const updateDiscount = useMutation({
    mutationFn: async (values: DiscountFormState) => {
      const payload = buildDiscountPayload(values);
      return hateoasClient.update('discounts', discountId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      queryClient.invalidateQueries({ queryKey: ['discount', discountId] });
      toast({
        title: 'Discount Updated',
        description: 'Changes have been saved successfully.',
      });
      router.push('/discounts');
      router.refresh();
    },
    onError: (updateError: Error) => {
      toast({
        title: 'Failed to update discount',
        description: updateError.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (values: DiscountFormState) => {
    updateDiscount.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading discount...</p>
      </div>
    );
  }

  if (error || !discount) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/discounts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Discount Not Found</h1>
            <p className="text-muted-foreground">We could not load this discount. It may have been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/discounts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Discount</h1>
          <p className="text-muted-foreground">Update the discount details and scope.</p>
        </div>
      </div>

      <DiscountForm
        submitLabel="Save Changes"
        submitting={updateDiscount.isPending}
        onCancelHref="/discounts"
        onSubmit={handleSubmit}
        initialData={initialData}
      />
    </div>
  );
}
