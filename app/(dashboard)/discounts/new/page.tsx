'use client';

import { DiscountForm, type DiscountFormState } from '@/components/discount/discount-form';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function NewDiscountPage() {
  const router = useRouter();

  const createDiscount = useMutation({
    mutationFn: async (values: DiscountFormState) => {
      const payload = buildDiscountPayload(values);
      return hateoasClient.create('discounts', payload);
    },
    onSuccess: () => {
      toast({
        title: 'Discount Created',
        description: 'The new discount is now available.',
      });
      router.push('/discounts');
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create discount',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (values: DiscountFormState) => {
    createDiscount.mutate(values);
  };

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
          <h1 className="text-3xl font-bold">Create Discount</h1>
          <p className="text-muted-foreground">Configure a new discount and choose where it applies.</p>
        </div>
      </div>

      <DiscountForm
        submitLabel="Create Discount"
        submitting={createDiscount.isPending}
        onCancelHref="/discounts"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
