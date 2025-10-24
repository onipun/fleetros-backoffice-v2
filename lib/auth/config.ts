// Keycloak Configuration
export const KEYCLOAK_CONFIG = {
  issuer: process.env.KEYCLOAK_ISSUER || 'http://localhost:8180/realms/backoffice',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'backoffice-client',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'kypYMXtLSCxDjw8D6kNUSTwWigJEkqiF',
  authorizationEndpoint:
    process.env.KEYCLOAK_AUTHORIZATION_ENDPOINT ||
    'http://localhost:8180/realms/backoffice/protocol/openid-connect/auth',
  tokenEndpoint:
    process.env.KEYCLOAK_TOKEN_ENDPOINT ||
    'http://localhost:8180/realms/backoffice/protocol/openid-connect/token',
  userInfoEndpoint:
    process.env.KEYCLOAK_USERINFO_ENDPOINT ||
    'http://localhost:8180/realms/backoffice/protocol/openid-connect/userinfo',
  jwksEndpoint:
    process.env.KEYCLOAK_JWKS_ENDPOINT ||
    'http://localhost:8180/realms/backoffice/protocol/openid-connect/certs',
  endSessionEndpoint:
    process.env.KEYCLOAK_END_SESSION_ENDPOINT ||
    'http://localhost:8180/realms/backoffice/protocol/openid-connect/logout',
};

export const APP_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiUrl: process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082',
  backendUserInfoEndpoint: process.env.BACKEND_USERINFO_ENDPOINT || 'http://localhost:8082/api/auth/userinfo',
};

export const SESSION_CONFIG = {
  cookieName: 'fleetros_session',
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_production',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
};

export const OAUTH_CONFIG = {
  scope: 'openid profile email roles',
  responseType: 'code',
  grantType: 'authorization_code',
  refreshGrantType: 'refresh_token',
};
