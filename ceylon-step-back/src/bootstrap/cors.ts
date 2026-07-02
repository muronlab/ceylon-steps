type CorsOriginConfig = string[] | true;

function parseOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
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
  env: Record<string, string | undefined> = process.env,
): CorsOriginConfig {
  const allowAll = env.CORS_ALLOW_ALL_ORIGINS?.toLowerCase() === 'true';
  if (allowAll) return true;

  const configuredOrigins = parseOrigins(env.CORS_ALLOWED_ORIGINS);
  if (configuredOrigins.length > 0) return configuredOrigins;

  if (env.NODE_ENV?.toLowerCase() === 'development') return true;

  return ['http://localhost:3000', 'http://localhost:3001'];
}

export const CORS_ORIGINS = getCorsOriginConfig();
