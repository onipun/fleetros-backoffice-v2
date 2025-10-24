import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    console.log('🖼️ Proxy image request for:', imageUrl);

    if (!imageUrl) {
      console.error('❌ No image URL provided');
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Get session token for authentication
    const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/session`);
    let token = null;
    
    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      token = session.accessToken;
      console.log('✅ Got auth token for image proxy');
    } else {
      console.warn('⚠️ Failed to get auth token, proceeding without authentication');
    }

    // Fetch the image from the backend with authentication
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('🔄 Fetching image from backend:', imageUrl);
    const response = await fetch(imageUrl, { headers });

    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('✅ Successfully proxied image:', imageUrl, 'Type:', contentType, 'Size:', imageBuffer.byteLength);

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('💥 Error proxying image:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
