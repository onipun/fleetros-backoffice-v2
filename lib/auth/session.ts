import { SessionOptions } from 'iron-session';
import { SESSION_CONFIG } from './config';

export interface SessionData {
  userId?: string; // User ID
  refreshToken?: string; // Only store refresh token, not access token
  expiresAt?: number; // Token expiration
  isLoggedIn: boolean;
}

const defaultSession: SessionData = {
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: SESSION_CONFIG.password,
  cookieName: SESSION_CONFIG.cookieName,
  cookieOptions: SESSION_CONFIG.cookieOptions,
};

// Helper functions to work with session data
export function createSession(
  userId: string,
  refreshToken: string,
  refreshExpiresIn: number
): SessionData {
  // Use refresh token expiration, not access token expiration
  // Refresh tokens typically last much longer (hours/days)
  return {
    userId,
    refreshToken,
    expiresAt: Date.now() + refreshExpiresIn * 1000,
    isLoggedIn: true,
  };
}

export function isSessionExpired(session: SessionData): boolean {
  if (!session.isLoggedIn || !session.expiresAt) {
    return true;
  }
  
  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  
  return session.expiresAt <= now + bufferTime;
}
