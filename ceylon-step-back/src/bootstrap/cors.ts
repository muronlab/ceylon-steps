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
 * The backend can be configured to accept requests from any origin.
 * `CORS_ALLOW_ALL_ORIGINS=true` enables universal CORS for all environments.
 * `CORS_ALLOWED_ORIGINS` still works when a fixed allow-list is needed.
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

  return true;
}

export const CORS_ORIGINS = getCorsOriginConfig();
