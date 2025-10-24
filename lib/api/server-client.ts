import { createServerHateoasClient } from '@/lib/api/hateoas-client';
import { getServerAccessToken } from '@/lib/auth/server-session';

export function getServerHateoasClient() {
  return createServerHateoasClient(getServerAccessToken);
}
