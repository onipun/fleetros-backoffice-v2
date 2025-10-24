import { getLogoutUrl } from '@/lib/auth/oauth';
import { sessionOptions } from '@/lib/auth/session';
import { unsealData } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Logs out the user and redirects to Keycloak logout
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(sessionOptions.cookieName);
    
    let idToken: string | undefined;
    
    // Try to get the ID token from session for proper Keycloak logout
    if (sessionCookie) {
      try {
        const session: any = await unsealData(sessionCookie.value, {
          password: sessionOptions.password,
        });
        idToken = session.idToken;
      } catch (error) {
        console.error('Failed to unseal session:', error);
      }
    }
    
    // Clear the session cookie
    cookieStore.delete(sessionOptions.cookieName);
    
    // Build logout URL
    const logoutUrl = getLogoutUrl(idToken);
    
    return NextResponse.json({ logoutUrl });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 * Alternative GET method for direct logout links
 */
export async function GET(request: NextRequest) {
  const response = await POST(request);
  const data = await response.json();
  
  if (data.logoutUrl) {
    return NextResponse.redirect(data.logoutUrl);
  }
  
  return NextResponse.redirect('/login');
}
