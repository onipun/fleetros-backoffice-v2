'use server';

import { getServerHateoasClient } from '@/lib/api/server-client';
import { revalidatePath } from 'next/cache';

export async function deletePricing(pricingId: string) {
  if (!pricingId) {
    throw new Error('Missing pricing identifier');
  }

  const client = getServerHateoasClient();
  await client.delete('pricings', pricingId);
  revalidatePath('/pricings');
}
