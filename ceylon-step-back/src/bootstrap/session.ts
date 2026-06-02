import { ConfigService } from '@nestjs/config';
import type { RequestHandler } from 'express';
import session from 'express-session';
import createPgSessionStore from 'connect-pg-simple';
import pg from 'pg';

/**
 * Builds the `express-session` middleware once and caches it, so the HTTP layer
 * and the WebSocket gateway share the *same* session reader — same secret, same
 * cookie name, same Postgres-backed store (`t_sessions`). The gateway applies it
 * to the Socket.IO handshake (`server.engine.use(...)`) to authenticate sockets
 * with the identical cookie session used by REST.
 *
 * In `test` the store is an in-memory store (no Postgres dependency).
 */
let cached: RequestHandler | null = null;

export function buildSessionMiddleware(config: ConfigService): RequestHandler {
  if (cached) return cached;

  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
  const PgSessionStore = createPgSessionStore(session);

  const cookieSecure = config.get<boolean>('SESSION_COOKIE_SECURE') ?? false;
  const cookieSameSite =
    config.get<'lax' | 'strict' | 'none'>('SESSION_COOKIE_SAMESITE') ?? 'lax';
  const cookieDomain =
    (config.get<string>('SESSION_COOKIE_DOMAIN') ?? '').trim() || undefined;

  const pool =
    nodeEnv === 'test'
      ? null
      : new pg.Pool({ connectionString: config.get<string>('DATABASE_URL') });

  cached = session({
    name: config.get<string>('SESSION_COOKIE_NAME') ?? 'sid',
    secret: config.get<string>('SESSION_SECRET')!,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      domain: cookieDomain,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    store:
      nodeEnv === 'test'
        ? new session.MemoryStore()
        : new PgSessionStore({
            pool: pool!,
            tableName: 't_sessions',
            createTableIfMissing: true,
          }),
  });

  return cached;
}
