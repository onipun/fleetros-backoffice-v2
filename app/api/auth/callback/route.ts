import { APP_CONFIG } from '@/lib/auth/config';
import { exchangeCodeForTokens, getUserInfo, mapUserInfo } from '@/lib/auth/oauth';
import { createSession, sessionOptions } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/callback
 * Handles the OAuth callback from Keycloak
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Callback] Received callback request');
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for errors from Keycloak
    if (error) {
      console.error('[Callback] OAuth error:', error);
      return NextResponse.redirect(
        `${APP_CONFIG.baseUrl}/login?error=${encodeURIComponent(error)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[Callback] Missing parameters - code:', !!code, 'state:', !!state);
      return NextResponse.redirect(
        `${APP_CONFIG.baseUrl}/login?error=missing_parameters`
      );
    }

    // Validate state to prevent CSRF
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    
    console.log('[Callback] Validating state - stored:', !!storedState, 'received:', !!state);
    
    if (!storedState || storedState !== state) {
      console.error('[Callback] Invalid state - stored:', storedState, 'received:', state);
      return NextResponse.redirect(
        `${APP_CONFIG.baseUrl}/login?error=invalid_state`
      );
    }

    // Clear the state cookie
    cookieStore.delete('oauth_state');
    console.log('[Callback] State validated, exchanging code for tokens');

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log('[Callback] Tokens received, fetching user info');

    // Get user information
    const userInfo = await getUserInfo(tokens.access_token);
    console.log('[Callback] User info received:', userInfo.email);

    // Map to our User type
    const user = mapUserInfo(userInfo, tokens.access_token);
    console.log('[Callback] User mapped - username:', user.username, 'roles:', user.roles);

    // Create session data
    const sessionData = createSession(
      user,
      tokens.access_token,
      tokens.refresh_token,
      tokens.id_token,
      tokens.expires_in
    );

    // Save session using iron-session
    // Note: We need to use a workaround for Next.js 15 compatibility
    const response = NextResponse.redirect(`${APP_CONFIG.baseUrl}/dashboard`);
    
    // Manually set session cookie with encrypted data
    const { sealData } = await import('iron-session');
    const sealed = await sealData(sessionData, {
      password: sessionOptions.password,
    });
    
    const cookieOptions = sessionOptions.cookieOptions || {};
    response.cookies.set(sessionOptions.cookieName, sealed, {
      httpOnly: cookieOptions.httpOnly ?? true,
      secure: cookieOptions.secure ?? process.env.NODE_ENV === 'production',
      sameSite: cookieOptions.sameSite ?? 'lax',
      maxAge: cookieOptions.maxAge ?? 60 * 60 * 24 * 7,
      path: cookieOptions.path ?? '/',
    });
    
    console.log('[Callback] Session created, redirecting to dashboard');
    console.log('[Callback] Cookie set:', sessionOptions.cookieName);
    
    return response;
  } catch (error) {
    console.error('[Callback] Error during authentication:', error);
    if (error instanceof Error) {
      console.error('[Callback] Error message:', error.message);
      console.error('[Callback] Error stack:', error.stack);
    }
    return NextResponse.redirect(
      `${APP_CONFIG.baseUrl}/login?error=authentication_failed`
    );
  }
}
