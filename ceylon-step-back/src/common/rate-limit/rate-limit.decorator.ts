import { SetMetadata } from '@nestjs/common';

export type RateLimitConfig = {
  keyPrefix: string;
  points: number;
  durationSeconds: number;
};

export const RATE_LIMIT_KEY = 'rateLimit';

export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);

