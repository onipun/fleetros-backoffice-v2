import type { User } from '@/types';
import { APP_CONFIG, KEYCLOAK_CONFIG, OAUTH_CONFIG } from './config';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
}

interface UserInfoResponse {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}

// Backend API /api/auth/me response format
interface BackendAuthMeResponse {
  timestamp: string;
  authenticated: boolean;
  username: string;
  email: string;
  sub?: string; // Keycloak subject identifier
  accountId?: string; // Alternative identifier
  firstName?: string;
  lastName?: string;
  authorities: string[]; // ["ROLE_ADMIN", "CAP_VEHICLE_READ", ...]
  tokenInfo: {
    issuedAt: string;
    expiresAt: string;
    issuer: string;
  };
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Build the Keycloak authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CONFIG.clientId,
    redirect_uri: `${APP_CONFIG.baseUrl}/api/auth/callback/keycloak`,
    response_type: OAUTH_CONFIG.responseType,
    scope: OAUTH_CONFIG.scope,
    state,
  });

  return `${KEYCLOAK_CONFIG.authorizationEndpoint}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: OAUTH_CONFIG.grantType,
    code,
    client_id: KEYCLOAK_CONFIG.clientId,
    client_secret: KEYCLOAK_CONFIG.clientSecret,
    redirect_uri: `${APP_CONFIG.baseUrl}/api/auth/callback/keycloak`,
  });

  const response = await fetch(KEYCLOAK_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: OAUTH_CONFIG.refreshGrantType,
    refresh_token: refreshToken,
    client_id: KEYCLOAK_CONFIG.clientId,
    client_secret: KEYCLOAK_CONFIG.clientSecret,
  });

  const response = await fetch(KEYCLOAK_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetch user information from the backend API (not Keycloak)
 * The backend at localhost:8082 should have an endpoint that returns user info
 * based on the JWT token from Keycloak
 */
export async function getUserInfo(accessToken: string): Promise<UserInfoResponse> {
  // First, try to get user info from backend API at /api/auth/me
  try {
    const backendUrl = APP_CONFIG.backendUserInfoEndpoint || `${APP_CONFIG.apiUrl}/api/auth/me`;
    
    const backendResponse = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (backendResponse.ok) {
      const backendData: BackendAuthMeResponse = await backendResponse.json();
      
      // Convert backend response to UserInfoResponse format
      const userInfo: UserInfoResponse = {
        sub: backendData.sub || backendData.accountId || backendData.username,
        email: backendData.email,
        email_verified: backendData.authenticated,
        preferred_username: backendData.username,
        name: `${backendData.firstName || ''} ${backendData.lastName || ''}`.trim() || backendData.username,
        given_name: backendData.firstName || backendData.username.split('.')[0] || backendData.username,
        family_name: backendData.lastName || backendData.username.split('.')[1] || '',
        realm_access: {
          roles: backendData.authorities
            .filter(auth => auth.startsWith('ROLE_'))
            .map(auth => auth.replace('ROLE_', '').toLowerCase())
        },
        // Store capabilities in resource_access for later mapping
        resource_access: {
          [KEYCLOAK_CONFIG.clientId]: {
            roles: backendData.authorities
              .filter(auth => auth.startsWith('CAP_'))
              .map(auth => auth.replace('CAP_', '').toLowerCase())
          }
        }
      };
      
      return userInfo;
    }
  } catch (error) {
    // Fallback to Keycloak silently
  }

  // Fallback to Keycloak userinfo endpoint
  const response = await fetch(KEYCLOAK_CONFIG.userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user info: ${error}`);
  }

  return response.json();
}

/**
 * Convert Keycloak user info to our User type
 */
export function mapUserInfo(userInfo: UserInfoResponse, accessToken: string): User {
  // Extract roles from realm_access and resource_access
  const realmRoles = userInfo.realm_access?.roles || [];
  const clientRoles =
    userInfo.resource_access?.[KEYCLOAK_CONFIG.clientId]?.roles || [];
  const allRoles = [...new Set([...realmRoles, ...clientRoles])];

  // Extract capabilities - backend already provides these with CAP_ prefix converted to lowercase
  // The getUserInfo function converts CAP_VEHICLE_READ -> vehicle_read
  const capabilities: string[] = [];
  
  // Get capabilities from resource_access (converted from backend CAP_* authorities)
  const backendCapabilities = userInfo.resource_access?.[KEYCLOAK_CONFIG.clientId]?.roles || [];
  capabilities.push(...backendCapabilities);
  
  // Also map roles to default capabilities (fallback for Keycloak-only auth)
  const roleBasedCapabilities = allRoles.map((role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return ['admin:read', 'admin:write', 'admin:delete', 'users:manage'];
      case 'manager':
        return ['vehicles:manage', 'bookings:manage', 'reports:read'];
      case 'user':
        return ['bookings:read', 'vehicles:read'];
      default:
        return [];
    }
  }).flat();
  
  capabilities.push(...roleBasedCapabilities);

  return {
    id: userInfo.sub,
    username: userInfo.preferred_username,
    email: userInfo.email,
    emailVerified: userInfo.email_verified,
    firstName: userInfo.given_name || '',
    lastName: userInfo.family_name || '',
    roles: allRoles,
    capabilities: [...new Set(capabilities)], // Remove duplicates
  };
}

/**
 * Build the logout URL
 */
export function getLogoutUrl(idToken?: string): string {
  const params = new URLSearchParams({
    post_logout_redirect_uri: APP_CONFIG.baseUrl,
  });

  if (idToken) {
    params.append('id_token_hint', idToken);
  }

  return `${KEYCLOAK_CONFIG.endSessionEndpoint}?${params.toString()}`;
}
