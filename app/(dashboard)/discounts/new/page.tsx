'use client';

import { DiscountForm, type DiscountFormState } from '@/components/discount/discount-form';
import { useLocale } from '@/components/providers/locale-provider';
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
    payload.booking = `/api/v1/bookings/${values.targetEntityId}`;
  }

  return payload;
}

export default function NewDiscountPage() {
  const router = useRouter();
  const { t } = useLocale();

  const createDiscount = useMutation({
    mutationFn: async (values: DiscountFormState) => {
      const payload = buildDiscountPayload(values);
      return hateoasClient.create('discounts', payload);
    },
    onSuccess: () => {
      toast({
        title: t('discount.toast.createTitle'),
        description: t('discount.toast.createDescription'),
      });
      router.push('/discounts');
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: t('discount.toast.createErrorTitle'),
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
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('discount.newDiscount')}</h1>
          <p className="text-muted-foreground">{t('discount.createDescription')}</p>
        </div>
      </div>

      <DiscountForm
        submitLabel={t('discount.createDiscount')}
        submitting={createDiscount.isPending}
        onCancelHref="/discounts"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
