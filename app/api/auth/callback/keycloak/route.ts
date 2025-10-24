import { APP_CONFIG } from '@/lib/auth/config';
import { exchangeCodeForTokens, getUserInfo, mapUserInfo } from '@/lib/auth/oauth';
import { createSession, sessionOptions } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/callback/keycloak
 * Handles the OAuth callback from Keycloak
 * 
 * Flow:
 * 1. Receives authorization code from Keycloak
 * 2. Exchanges code for JWT tokens
 * 3. Fetches user info from backend or Keycloak
 * 4. Creates encrypted session
 * 5. Sets HttpOnly cookie with session
 * 6. Redirects to dashboard
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Callback] Received callback request from Keycloak');
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const sessionState = searchParams.get('session_state');
    const error = searchParams.get('error');

    console.log('[Callback] Parameters:', {
      hasCode: !!code,
      hasState: !!state,
      sessionState,
      error
    });

    // Check for errors from Keycloak
    if (error) {
      console.error('[Callback] OAuth error from Keycloak:', error);
      return NextResponse.redirect(
        `${APP_CONFIG.baseUrl}/login?error=${encodeURIComponent(error)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('[Callback] Missing required parameters - code:', !!code, 'state:', !!state);
      return NextResponse.redirect(
        `${APP_CONFIG.baseUrl}/login?error=missing_parameters`
      );
    }

    // Validate state to prevent CSRF
    const cookieStore = await cookies();
    const storedState = cookieStore.get('oauth_state')?.value;
    
    console.log('[Callback] Validating CSRF state - stored:', !!storedState, 'received:', !!state);
    
    if (!storedState || storedState !== state) {
      console.error('[Callback] CSRF validation failed - stored:', storedState, 'received:', state);
      return NextResponse.redirect(
        `${APP_CONFIG.baseUrl}/login?error=invalid_state`
      );
    }

    // Clear the state cookie
    cookieStore.delete('oauth_state');
    console.log('[Callback] CSRF state validated successfully');

    // Step 5: Exchange authorization code for JWT tokens
    console.log('[Callback] Exchanging authorization code for JWT tokens...');
    const tokens = await exchangeCodeForTokens(code);
    console.log('[Callback] ✓ JWT tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      hasIdToken: !!tokens.id_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope,
      sessionState: tokens.session_state
    });

    // Get user information from backend (or Keycloak as fallback)
    console.log('[Callback] Fetching user information...');
    const userInfo = await getUserInfo(tokens.access_token);
    console.log('[Callback] ✓ User info received:', {
      email: userInfo.email,
      username: userInfo.preferred_username,
      sub: userInfo.sub
    });

    // Map to our User type
    const user = mapUserInfo(userInfo, tokens.access_token);
    console.log('[Callback] ✓ User mapped:', {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      capabilities: user.capabilities
    });

    // Create session data - ONLY store refresh token to keep cookie small
    const sessionData = createSession(
      user.id,
      tokens.refresh_token,
      tokens.refresh_expires_in // Use refresh token expiration, not access token
    );

    console.log('[Callback] ✓ Session data created:', {
      isLoggedIn: sessionData.isLoggedIn,
      expiresAt: new Date(sessionData.expiresAt || 0).toISOString(),
      refreshExpiresIn: tokens.refresh_expires_in,
      hasRefreshToken: !!sessionData.refreshToken,
      userId: sessionData.userId
    });

    // Step 6: Store JWT in HttpOnly cookie
    console.log('[Callback] Setting HttpOnly session cookie...');
    
    // Encrypt session data using iron-session
    const { sealData } = await import('iron-session');
    const sealed = await sealData(sessionData, {
      password: sessionOptions.password,
    });
    
    // Create HTML page that sets cookie and redirects via JavaScript
    // This ensures the cookie is properly set before redirect
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting...</title>
  <style>
    body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .message { text-align: center; }
  </style>
</head>
<body>
  <div class="message">
    <h2>✓ Authentication successful!</h2>
    <p>Redirecting to dashboard...</p>
  </div>
  <script>
    // Give browser time to process Set-Cookie header before redirect
    setTimeout(() => {
      window.location.href = '${APP_CONFIG.baseUrl}/dashboard';
    }, 100);
  </script>
</body>
</html>`;
    
    const response = new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
    // Set the encrypted session cookie on the response
    const cookieOptions = sessionOptions.cookieOptions || {};
    response.cookies.set({
      name: sessionOptions.cookieName,
      value: sealed,
      httpOnly: cookieOptions.httpOnly ?? true,
      secure: cookieOptions.secure ?? (process.env.NODE_ENV === 'production'),
      sameSite: (cookieOptions.sameSite ?? 'lax') as 'lax' | 'strict' | 'none',
      maxAge: cookieOptions.maxAge ?? (60 * 60 * 24 * 7), // 7 days
      path: cookieOptions.path ?? '/',
    });
    
    console.log('[Callback] ✓ Cookie set successfully:', {
      name: sessionOptions.cookieName,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieOptions.maxAge ?? (60 * 60 * 24 * 7),
      path: '/',
      valueLength: sealed.length
    });
    
    // Log all response headers to verify Set-Cookie is present
    const headers = Object.fromEntries(response.headers.entries());
    console.log('[Callback] Response headers:', headers);
    console.log('[Callback] Set-Cookie header:', response.headers.get('set-cookie'));
    
    console.log('[Callback] ✓ Authentication complete! Redirecting to dashboard...');
    
    return response;
  } catch (error) {
    console.error('[Callback] ✗ Error during authentication:', error);
    if (error instanceof Error) {
      console.error('[Callback] Error message:', error.message);
      console.error('[Callback] Error stack:', error.stack);
    }
    return NextResponse.redirect(
      `${APP_CONFIG.baseUrl}/login?error=authentication_failed`
    );
  }
}
