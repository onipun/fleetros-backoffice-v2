'use client';

import { Button } from '@/components/ui/button';
import { deletePricing } from '@/app/(dashboard)/pricings/actions';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';

interface DeletePricingButtonProps {
  pricingId: string;
}

export function DeletePricingButton({ pricingId }: DeletePricingButtonProps) {
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    const shouldDelete = window.confirm('Are you sure you want to delete this pricing?');
    if (!shouldDelete) {
      return;
    }

    startTransition(async () => {
      await deletePricing(pricingId);
    });
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onDelete}
      disabled={isPending}
      aria-label="Delete pricing"
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
