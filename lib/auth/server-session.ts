import { refreshAccessToken } from '@/lib/auth/oauth';
import { SessionData, sessionOptions } from '@/lib/auth/session';
import { unsealData } from 'iron-session';
import { cookies } from 'next/headers';

export async function getServerAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(sessionOptions.cookieName);

    if (!sessionCookie) {
      return null;
    }

    const session = await unsealData<SessionData>(sessionCookie.value, {
      password: sessionOptions.password,
    });

    if (!session.isLoggedIn || !session.refreshToken) {
      return null;
    }

    const tokens = await refreshAccessToken(session.refreshToken);
    return tokens.access_token ?? null;
  } catch (error) {
    console.error('[server-session] Failed to resolve access token', error);
    return null;
  }
}
