'use client';

import { DiscountForm, type DiscountFormState } from '@/components/discount/discount-form';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { linkDiscountToOfferings, linkDiscountToPackages } from '@/lib/api/discount-api';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Discount } from '@/types';
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
    // New fields
    priority: values.priority,
    autoApply: values.autoApply,
    requiresPromoCode: values.requiresPromoCode,
    combinableWithOtherDiscounts: values.combinableWithOtherDiscounts,
    firstTimeCustomerOnly: values.firstTimeCustomerOnly,
  };

  return payload;
}

export default function NewDiscountPage() {
  const router = useRouter();
  const { t } = useLocale();

  const createDiscount = useMutation({
    mutationFn: async (values: DiscountFormState) => {
      // Step 1: Create the discount
      const payload = buildDiscountPayload(values);
      const createdDiscount = await hateoasClient.create<Discount>('discounts', payload);

      if (!createdDiscount.id) {
        throw new Error('Discount created but no ID returned');
      }

      // Step 2: Link to packages if applicable
      if (values.applicableScope === 'PACKAGE' && values.selectedPackageIds.length > 0) {
        try {
          await linkDiscountToPackages(createdDiscount.id, values.selectedPackageIds);
        } catch (linkError: any) {
          console.error('Failed to link packages:', linkError);
          // Don't fail the whole operation, just log warning
          toast({
            title: 'Warning',
            description: `Discount created but failed to link packages: ${linkError.message}`,
            variant: 'default',
          });
        }
      }

      // Step 3: Link to offerings if applicable
      if (values.applicableScope === 'OFFERING' && values.selectedOfferingIds.length > 0) {
        try {
          await linkDiscountToOfferings(createdDiscount.id, values.selectedOfferingIds);
        } catch (linkError: any) {
          console.error('Failed to link offerings:', linkError);
          // Don't fail the whole operation, just log warning
          toast({
            title: 'Warning',
            description: `Discount created but failed to link offerings: ${linkError.message}`,
            variant: 'default',
          });
        }
      }

      return createdDiscount;
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
