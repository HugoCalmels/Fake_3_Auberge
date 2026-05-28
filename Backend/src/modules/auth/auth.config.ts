import type { StringValue } from 'ms';

const DEFAULT_JWT_EXPIRES_IN = '12h';
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';

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
