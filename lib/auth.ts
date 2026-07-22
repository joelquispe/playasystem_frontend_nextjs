import { User } from '@/types/api';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from './constants';

/** Fallback cookie lifetime (seconds) when the token has no readable `exp` claim. */
const DEFAULT_COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60;

/**
 * Decodes a JWT's `exp` claim (seconds since epoch) without verifying the
 * signature — used only to size the client-side auth cookie so it doesn't
 * expire before (or long after) the actual access token. The backend is
 * always the source of truth for validating the token itself.
 */
function decodeJwtExpSeconds(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
}

/** Seconds remaining until the token's `exp`, clamped to a sane minimum. */
function cookieMaxAgeFor(token: string): number {
  const exp = decodeJwtExpSeconds(token);
  if (!exp) return DEFAULT_COOKIE_MAX_AGE_SECONDS;
  const remaining = exp - Math.floor(Date.now() / 1000);
  return remaining > 0 ? remaining : DEFAULT_COOKIE_MAX_AGE_SECONDS;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User, refreshToken?: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  // Cookie for middleware — sized to match the access token's real
  // expiration (decoded from its `exp` claim) instead of a hardcoded value,
  // so it never expires before/after the token itself regardless of the
  // backend's JWT_EXPIRES_IN configuration.
  document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; max-age=${cookieMaxAgeFor(token)}; SameSite=Lax`;
}

/**
 * Updates only the tokens after a silent refresh (keeps the previously
 * stored user in localStorage untouched).
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  document.cookie = `${AUTH_TOKEN_KEY}=${accessToken}; path=/; max-age=${cookieMaxAgeFor(accessToken)}; SameSite=Lax`;
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}
