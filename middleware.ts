import { unsealData } from 'iron-session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SessionData, isSessionExpired, sessionOptions } from './lib/auth/session';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/callback/keycloak', '/api/auth/test'];

// API routes that don't require authentication
const publicApiRoutes = ['/api/auth/login', '/api/auth/callback/keycloak', '/api/auth/test'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    console.log('[Middleware] Allowing public route:', pathname);
    return NextResponse.next();
  }

  console.log('[Middleware] Checking authentication for:', pathname);

  // Check for session cookie
  const sessionCookie = request.cookies.get(sessionOptions.cookieName);
  console.log('[Middleware] Cookie lookup:', {
    cookieName: sessionOptions.cookieName,
    found: !!sessionCookie,
    allCookies: request.cookies.getAll().map(c => c.name)
  });

  if (!sessionCookie) {
    console.log('[Middleware] No session cookie found');
    // No session - redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('[Middleware] Session cookie found, validating...');

  try {
    // Unseal and validate session
    const session = await unsealData<SessionData>(sessionCookie.value, {
      password: sessionOptions.password,
    });

    console.log('[Middleware] Session unsealed - isLoggedIn:', session.isLoggedIn, 'expired:', isSessionExpired(session));
    console.log('[Middleware] Session details:', {
      expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : 'undefined',
      now: new Date().toISOString(),
      timeLeft: session.expiresAt ? Math.floor((session.expiresAt - Date.now()) / 1000) : 'N/A',
      hasRefreshToken: !!session.refreshToken,
      userId: session.userId
    });

    // Check if session is valid
    if (!session.isLoggedIn || isSessionExpired(session)) {
      console.log('[Middleware] Session invalid or expired');
      // Session expired - clear cookie and redirect
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Session expired' }, { status: 401 })
        : NextResponse.redirect(new URL('/login?error=session_expired', request.url));
      
      response.cookies.delete(sessionOptions.cookieName);
      return response;
    }

    // Session is valid - continue
    console.log('[Middleware] Session valid, allowing access');
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Session validation error:', error);
    
    // Invalid session - clear cookie and redirect
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    
    response.cookies.delete(sessionOptions.cookieName);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
