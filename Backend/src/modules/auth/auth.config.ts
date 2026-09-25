import type { StringValue } from 'ms';

const DEFAULT_JWT_EXPIRES_IN = '12h';
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';

export const ADMIN_TOKEN_COOKIE_NAME = 'admin_token';
export const ADMIN_TOKEN_COOKIE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

// Frontend (Netlify) and backend are deployed on different domains in
// production, so the cookie must be SameSite=None (which requires Secure) to
// be sent on cross-site fetch() calls. In local dev, frontend/backend share
// "localhost" as their site (only the port differs) so Lax + non-Secure works
// over plain http.
export function getAdminTokenCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    path: '/',
  };
}

export function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwtSecret;
}

export function getJwtExpiresIn(): StringValue {
  return (process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN) as StringValue;
}

export function getFrontendOrigin() {
  return process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN;
}
