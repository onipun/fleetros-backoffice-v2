import { getUserInfo, mapUserInfo, refreshAccessToken } from '@/lib/auth/oauth';
import { SessionData, sessionOptions } from '@/lib/auth/session';
import { unsealData } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/session
 * Returns the current session data
 * Automatically refreshes the token if expired
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(sessionOptions.cookieName);
    
    if (!sessionCookie) {
      return NextResponse.json(
        { isLoggedIn: false },
        { status: 401 }
      );
    }
    
    // Unseal the session data
    let session = await unsealData<SessionData>(sessionCookie.value, {
      password: sessionOptions.password,
    });
    
    if (!session.isLoggedIn || !session.refreshToken) {
      return NextResponse.json(
        { isLoggedIn: false },
        { status: 401 }
      );
    }
    
    // Refresh the access token to get current user info
    try {
      const tokens = await refreshAccessToken(session.refreshToken);
      
      // Fetch updated user info with new token
      const userInfoResponse = await getUserInfo(tokens.access_token);
      const userInfo = mapUserInfo(userInfoResponse, tokens.access_token);
      
      // Return user data with fresh access token
      return NextResponse.json({
        isLoggedIn: true,
        user: userInfo,
        accessToken: tokens.access_token,
        expiresAt: session.expiresAt,
      });
    } catch (refreshError) {
      // Token refresh failed, session is invalid
      console.error('[Session] Token refresh failed:', refreshError);
      cookieStore.delete(sessionOptions.cookieName);
      return NextResponse.json(
        { isLoggedIn: false, expired: true },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[Session] Session check error:', error);
    return NextResponse.json(
      { isLoggedIn: false },
      { status: 401 }
    );
  }
}
