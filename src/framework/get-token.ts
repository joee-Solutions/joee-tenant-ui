import Cookies from 'js-cookie';

export const getToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const AUTH_TOKEN = Cookies.get('auth_token');
  return AUTH_TOKEN;
};

export const getRefreshToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const AUTH_TOKEN = Cookies.get('refresh_token');
  return AUTH_TOKEN;
};

export const getMfaToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const AUTH_TOKEN = Cookies.get('mfa_token');
  return AUTH_TOKEN;
};

/**
 * Decode JWT payload without verification (client-side only for exp check).
 * Returns { exp, iat } or null if invalid.
 */
export const decodeToken = (token: string | null): { exp?: number; iat?: number } | null => {
  if (!token || typeof token !== 'string' || token.trim().length < 10) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload)) as { exp?: number; iat?: number };
  } catch {
    return null;
  }
};

/** Buffer in seconds before expiry to treat token as "expiring soon" (default 2 minutes) */
const EXPIRY_BUFFER_SECONDS = 120;

/**
 * Returns true if the token is missing, expired, or will expire within EXPIRY_BUFFER_SECONDS.
 * Use this to decide whether to refresh before making a request.
 */
export const isTokenExpiredOrExpiringSoon = (token: string | null): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || decoded.exp == null) return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return decoded.exp <= nowSeconds + EXPIRY_BUFFER_SECONDS;
};