import { APP_CONFIG, KEYCLOAK_CONFIG } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/test
 * Test endpoint to verify authentication configuration
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: {
      keycloak: {
        issuer: KEYCLOAK_CONFIG.issuer,
        clientId: KEYCLOAK_CONFIG.clientId,
        authorizationEndpoint: KEYCLOAK_CONFIG.authorizationEndpoint,
        hasClientSecret: !!KEYCLOAK_CONFIG.clientSecret,
      },
      app: {
        baseUrl: APP_CONFIG.baseUrl,
        apiUrl: APP_CONFIG.apiUrl,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
      },
    },
  });
}
