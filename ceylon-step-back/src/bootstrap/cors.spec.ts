import { getCorsOriginConfig } from './cors';

describe('getCorsOriginConfig', () => {
  it('allows any origin when CORS_ALLOW_ALL_ORIGINS is true (boolean)', () => {
    expect(
      getCorsOriginConfig({
        NODE_ENV: 'development',
        CORS_ALLOW_ALL_ORIGINS: true,
      }),
    ).toBe(true);
  });

  it('allows any origin when CORS_ALLOW_ALL_ORIGINS is "true" (string)', () => {
    expect(
      getCorsOriginConfig({
        NODE_ENV: 'development',
        CORS_ALLOW_ALL_ORIGINS: 'true',
      }),
    ).toBe(true);
  });

  it('uses the configured allow-list in production', () => {
    expect(
      getCorsOriginConfig({
        NODE_ENV: 'production',
        CORS_ALLOWED_ORIGINS: 'https://app.example.com, https://admin.example.com',
      }),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('falls back to any origin in development when nothing is configured', () => {
    expect(
      getCorsOriginConfig({
        NODE_ENV: 'development',
        CORS_ALLOW_ALL_ORIGINS: false,
      }),
    ).toBe(true);
  });

  it('defaults to localhost origins when in production with no config', () => {
    expect(
      getCorsOriginConfig({
        NODE_ENV: 'production',
        CORS_ALLOW_ALL_ORIGINS: false,
      }),
    ).toEqual(['http://localhost:3000', 'http://localhost:3001']);
  });
});
