import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/// Where a completed OAuth handshake should return the user.
export type OauthAppTarget = 'admin' | 'mobile' | 'site';

/// Normalise the untrusted `?app=` hint (or round-tripped `state`) to a known
/// target, defaulting to the public site.
export function normaliseOauthApp(value: unknown): OauthAppTarget {
  return value === 'admin' ? 'admin' : value === 'mobile' ? 'mobile' : 'site';
}

/// Init guards for the OAuth *start* endpoints. Each carries the app target
/// through the provider round-trip via the OAuth `state` parameter — the only
/// value providers echo back. We cannot use the session here: Passport ends the
/// response (the redirect to the provider) from inside `canActivate`, so the
/// route handler body never runs and any session write there is lost.
@Injectable()
export class GoogleInitGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    return { state: normaliseOauthApp(req.query.app) };
  }
}

@Injectable()
export class FacebookInitGuard extends AuthGuard('facebook') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    return { state: normaliseOauthApp(req.query.app) };
  }
}

@Injectable()
export class AppleInitGuard extends AuthGuard('apple') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    return { state: normaliseOauthApp(req.query.app) };
  }
}
