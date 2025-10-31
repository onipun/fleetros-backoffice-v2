import { unsealData } from 'iron-session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SessionData, isSessionExpired, sessionOptions } from './lib/auth/session';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/accept-invitation', '/api/auth/login', '/api/auth/callback/keycloak', '/api/auth/test'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get(sessionOptions.cookieName);

  if (!sessionCookie) {
    // No session - redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Unseal and validate session
    const session = await unsealData<SessionData>(sessionCookie.value, {
      password: sessionOptions.password,
    });

    // Check if session is valid
    if (!session.isLoggedIn || isSessionExpired(session)) {
      // Session expired - clear cookie and redirect
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Session expired' }, { status: 401 })
        : NextResponse.redirect(new URL('/login?error=session_expired', request.url));
      
      response.cookies.delete(sessionOptions.cookieName);
      return response;
    }

    // Session is valid - continue
    return NextResponse.next();
  } catch (error) {
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
