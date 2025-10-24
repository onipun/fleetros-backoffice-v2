'use server';

import { getServerHateoasClient } from '@/lib/api/server-client';
import { revalidatePath } from 'next/cache';

export async function deleteDiscount(discountId: string) {
  if (!discountId) {
    throw new Error('Missing discount identifier');
  }

  const client = getServerHateoasClient();
  await client.delete('discounts', discountId);
  revalidatePath('/discounts');
}
