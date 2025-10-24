import { generateState, getAuthorizationUrl } from '@/lib/auth/oauth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/login
 * Initiates the OAuth flow by redirecting to Keycloak
 */
export async function GET(request: NextRequest) {
  try {
    // Generate state for CSRF protection
    const state = generateState();
    // Store state in cookie for validation in callback
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Build authorization URL
    const authUrl = getAuthorizationUrl(state);

    // Redirect to Keycloak
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initiate login', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
