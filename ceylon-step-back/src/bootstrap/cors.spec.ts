import { getCorsOriginConfig } from './cors';

describe('getCorsOriginConfig', () => {
  it('allows any origin in development when CORS_ALLOW_ALL_ORIGINS is enabled', () => {
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

  it('falls back to localhost origins when nothing is configured', () => {
    expect(
      getCorsOriginConfig({
        NODE_ENV: 'development',
        CORS_ALLOW_ALL_ORIGINS: 'false',
      }),
    ).toBe(true);
  });
});
