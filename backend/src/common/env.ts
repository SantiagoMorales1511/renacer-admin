const isProduction = () => process.env.NODE_ENV === 'production';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }
  if (isProduction()) {
    throw new Error('JWT_SECRET es obligatorio en producción');
  }
  return 'dev-secret-solo-local';
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN?.trim() || '7d';
}

export function getCorsOrigins(): string[] | boolean {
  const raw = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '').trim();
  if (!raw) {
    return isProduction() ? false : true;
  }
  if (raw === '*') {
    return true;
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
