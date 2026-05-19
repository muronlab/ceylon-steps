import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { RATE_LIMIT_KEY, RateLimitConfig } from './rate-limit.decorator';

type Limiter = {
  consume: (key: string, points?: number) => Promise<RateLimiterRes>;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limiters = new Map<string, Limiter>();

  constructor(private readonly reflector: Reflector) {}

  private getLimiter(config: RateLimitConfig): Limiter {
    const id = `${config.keyPrefix}:${config.points}:${config.durationSeconds}`;
    const existing = this.limiters.get(id);
    if (existing) return existing;

    const limiter = new RateLimiterMemory({
      points: config.points,
      duration: config.durationSeconds,
    });
    this.limiters.set(id, limiter);
    return limiter;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const config = this.reflector.get<RateLimitConfig | undefined>(RATE_LIMIT_KEY, handler);
    if (!config) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip || 'unknown';

    const key = `${config.keyPrefix}:${ip}`;
    const limiter = this.getLimiter(config);

    try {
      await limiter.consume(key);
      return true;
    } catch {
      // Nest will respond 403 by default; we want 429-ish semantics but keep it simple
      // Throwing is better, but to avoid adding more classes now, just deny.
      return false;
    }
  }
}

