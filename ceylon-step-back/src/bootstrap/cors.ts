/**
 * Allow-listed browser origins for CORS. Shared by the HTTP layer
 * (`setup-app.ts`) and the WebSocket gateway so they never drift apart.
 *
 * Native mobile clients do not send an `Origin` header and are therefore not
 * subject to this list. Never add `*` — cookie-session auth requires
 * `credentials: true`, which is incompatible with a wildcard origin.
 */
export const CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];
