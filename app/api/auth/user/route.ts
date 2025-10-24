import { getUserInfo, mapUserInfo, refreshAccessToken } from '@/lib/auth/oauth';
import { SessionData, sessionOptions } from '@/lib/auth/session';
import { unsealData } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/user
 * Returns the current authenticated user's information
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(sessionOptions.cookieName);

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Unseal session
    const session = await unsealData<SessionData>(sessionCookie.value, {
      password: sessionOptions.password,
    });

    if (!session.isLoggedIn || !session.refreshToken) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Refresh access token using refresh token
    const tokens = await refreshAccessToken(session.refreshToken);
    
    // Fetch fresh user info from backend using new access token
    const userInfo = await getUserInfo(tokens.access_token);
    const user = mapUserInfo(userInfo, tokens.access_token);

    return NextResponse.json(user);
  } catch (error) {
    console.error('[API] Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}
