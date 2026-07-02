import { z } from 'zod';

const boolFromString = z
  .union([z.literal('true'), z.literal('false')])
  .transform((v) => v === 'true');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url(),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:3000'),
  ADMIN_FRONTEND_URL: z.string().url().optional().default('http://localhost:3001'),

  DATABASE_URL: z.string().min(1),

  SESSION_SECRET: z.string().min(16),
  SESSION_COOKIE_NAME: z.string().min(1).default('sid'),
  SESSION_COOKIE_SECURE: boolFromString.default(false),
  SESSION_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  SESSION_COOKIE_DOMAIN: z.string().optional().default(''),

  CSRF_ENABLED: boolFromString.default(false),
  CORS_ALLOW_ALL_ORIGINS: boolFromString.default(true),
  CORS_ALLOWED_ORIGINS: z.string().optional().default(''),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default(''),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().url().optional().default('http://localhost:3000/api/v1/auth/oauth/google/callback'),

  FACEBOOK_APP_ID: z.string().optional().default(''),
  FACEBOOK_APP_SECRET: z.string().optional().default(''),
  FACEBOOK_CALLBACK_URL: z.string().url().optional().default('http://localhost:3000/api/v1/auth/oauth/facebook/callback'),

  APPLE_CLIENT_ID: z.string().optional().default(''),
  APPLE_TEAM_ID: z.string().optional().default(''),
  APPLE_KEY_ID: z.string().optional().default(''),
  APPLE_PRIVATE_KEY: z.string().optional().default(''),
  APPLE_CALLBACK_URL: z.string().url().optional().default('http://localhost:3000/api/v1/auth/oauth/apple/callback'),

  SUPABASE_URL: z.string().url().optional().default(''),
  SUPABASE_KEY: z.string().optional().default(''),
  SUPABASE_BUCKET: z.string().optional().default(''),

  MOBILE_OAUTH_REDIRECT: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>) {
  const parsed = envSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  const formatted = parsed.error.issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${formatted}`);
}

