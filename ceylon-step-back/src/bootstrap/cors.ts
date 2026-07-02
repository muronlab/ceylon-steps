type CorsOriginConfig = string[] | true;

function parseOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isTrueValue(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

/**
 * Allow-listed browser origins for CORS. Shared by the HTTP layer
 * (`setup-app.ts`) and the WebSocket gateway so they never drift apart.
 *
 * In development, the backend can be configured to accept requests from any
 * frontend origin. In production, the allow-list is controlled by
 * `CORS_ALLOWED_ORIGINS` so cookie-based sessions stay locked to known hosts.
 */
export function getCorsOriginConfig(
  env: Record<string, unknown> = process.env,
): CorsOriginConfig {
  const allowAll = isTrueValue(env.CORS_ALLOW_ALL_ORIGINS);
  if (allowAll) return true;

  const configuredOrigins = parseOrigins(String(env.CORS_ALLOWED_ORIGINS ?? ''));
  if (configuredOrigins.length > 0) return configuredOrigins;

  const nodeEnv = String(env.NODE_ENV ?? '').toLowerCase();
  if (nodeEnv === 'development') return true;

  return ['http://localhost:3000', 'http://localhost:3001'];
}

export const CORS_ORIGINS = getCorsOriginConfig();
