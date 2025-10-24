import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({ message: 'Cookie test' });
  
  // Set a simple test cookie
  response.cookies.set('test_cookie', 'test_value', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
  
  console.log('[Test] Cookie set in response');
  console.log('[Test] Response headers:', Object.fromEntries(response.headers.entries()));
  
  return response;
}
