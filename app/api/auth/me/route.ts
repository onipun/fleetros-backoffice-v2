import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 * Proxies to backend /api/auth/me endpoint
 * Returns user information including accountId needed for merchant onboarding
 * 
 * Documentation: FRONTEND_API_REFERENCE.md - Authentication Section
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session to retrieve access token
    const sessionResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/session`,
      {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      }
    );

    if (!sessionResponse.ok) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          authenticated: false,
          message: 'User is not authenticated',
        },
        { status: 401 }
      );
    }

    const session = await sessionResponse.json();
    
    if (!session.isLoggedIn || !session.accessToken) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          authenticated: false,
          message: 'User is not authenticated',
        },
        { status: 401 }
      );
    }

    // Call backend /api/auth/me with the access token
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
    const backendEndpoint = `${backendUrl}/api/auth/me`;
    
    console.log('[/api/auth/me] Calling backend:', backendEndpoint);
    console.log('[/api/auth/me] Access token:', session.accessToken?.substring(0, 20) + '...');
    
    const backendResponse = await fetch(backendEndpoint, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[/api/auth/me] Backend error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        body: errorText,
      });
      
      if (backendResponse.status === 401) {
        return NextResponse.json(
          {
            timestamp: new Date().toISOString(),
            authenticated: false,
            message: 'User is not authenticated',
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          authenticated: false,
          message: 'Failed to fetch user information',
        },
        { status: backendResponse.status }
      );
    }

    // Return backend response as-is
    const userData = await backendResponse.json();
    return NextResponse.json(userData, { status: 200 });
    
  } catch (error) {
    console.error('[/api/auth/me] Error:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        authenticated: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
