'use client';

import { deleteDiscount } from '@/app/(dashboard)/discounts/actions';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';

interface DeleteDiscountButtonProps {
  discountId: string;
}

export function DeleteDiscountButton({ discountId }: DeleteDiscountButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm('Are you sure you want to delete this discount?');
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      await deleteDiscount(discountId);
    });
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete discount"
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
