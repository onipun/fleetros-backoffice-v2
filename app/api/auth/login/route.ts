import { generateState, getAuthorizationUrl } from '@/lib/auth/oauth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/login
 * Initiates the OAuth flow by redirecting to Keycloak
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Login] Starting OAuth flow...');
    
    // Generate state for CSRF protection
    const state = generateState();
    console.log('[Login] Generated state:', state);
    
    // Store state in cookie for validation in callback
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
    console.log('[Login] State cookie set');

    // Build authorization URL
    const authUrl = getAuthorizationUrl(state);
    console.log('[Login] Redirecting to:', authUrl);

    // Redirect to Keycloak
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Login] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate login', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
