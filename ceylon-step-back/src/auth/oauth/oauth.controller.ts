import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { OauthService } from './oauth.service';
import { AuthProvider, Prisma } from '@prisma/client';
import type { SessionData } from '../auth.types';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { ExchangeOauthCodeDto } from './dto/exchange-oauth-code.dto';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../../common/rate-limit/rate-limit.guard';
import {
  AppleInitGuard,
  FacebookInitGuard,
  GoogleInitGuard,
  normaliseOauthApp,
  OauthAppTarget,
} from './guards/oauth-init.guards';

/// Shape that the Passport OAuth strategies put on `req.user` (see the
/// `*.strategy.ts` files). Typing it here keeps the controller free of `any`.
type OAuthUserPayload = {
  providerUserId: string;
  email: string | null;
  profile?: Prisma.JsonValue;
};

@ApiTags('auth')
@Controller('auth/oauth')
export class OauthController {
  constructor(
    private readonly oauth: OauthService,
    private readonly config: ConfigService,
  ) {}

  private getSiteUrl() {
    return this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  private getAdminUrl() {
    return (
      this.config.get<string>('ADMIN_FRONTEND_URL') ?? 'http://localhost:3001'
    );
  }

  private getMobileRedirect() {
    return (
      this.config.get<string>('MOBILE_OAUTH_REDIRECT') ??
      'ceylonsteps://auth/callback'
    );
  }

  /// The app target is carried through the provider round-trip in the OAuth
  /// `state` parameter (see the init guards). passport-apple merges its form_post
  /// body into `req.query`, so `state` is here for every provider.
  private resolveAppTarget(req: Request): OauthAppTarget {
    return normaliseOauthApp(req.query.state);
  }

  private webCallbackUrl(app: OauthAppTarget, path = '') {
    const base = app === 'admin' ? this.getAdminUrl() : this.getSiteUrl();
    return `${base}${path}`;
  }

  /// Native (mobile) clients cannot carry a browser cookie back into the app, so
  /// instead of opening a session here we mint a single-use code and bounce to
  /// the app's deep link. The app exchanges the code via POST /auth/oauth/exchange.
  private async completeMobileLogin(
    req: Request,
    res: Response,
    provider: AuthProvider,
  ) {
    const u = req.user as OAuthUserPayload;

    const user = await this.oauth.findOrCreateByProvider({
      provider,
      providerUserId: u.providerUserId,
      email: u.email,
      profile: u.profile,
    });

    const code = await this.oauth.issueExchangeCode(user.id);
    return res.redirect(
      `${this.getMobileRedirect()}?code=${encodeURIComponent(code)}`,
    );
  }

  /// Shared web/admin handler: link to the current user if one is signed in,
  /// otherwise find-or-create and open a session, then redirect to the frontend.
  private async completeWebLogin(
    req: Request,
    res: Response,
    provider: AuthProvider,
    app: OauthAppTarget,
  ) {
    const u = req.user as OAuthUserPayload;
    const session = req.session as unknown as SessionData;

    if (session.userId) {
      await this.oauth.linkIdentity({
        userId: session.userId,
        provider,
        providerUserId: u.providerUserId,
        profile: u.profile,
      });
      return res.redirect(this.webCallbackUrl(app, '/dashboard'));
    }

    const user = await this.oauth.findOrCreateByProvider({
      provider,
      providerUserId: u.providerUserId,
      email: u.email,
      profile: u.profile,
    });

    session.userId = user.id;
    session.loginAt = new Date().toISOString();
    return res.redirect(this.webCallbackUrl(app));
  }

  private handleCallback(req: Request, res: Response, provider: AuthProvider) {
    const app = this.resolveAppTarget(req);
    return app === 'mobile'
      ? this.completeMobileLogin(req, res, provider)
      : this.completeWebLogin(req, res, provider, app);
  }

  @ApiOperation({ summary: 'Start Google OAuth' })
  @Get('google')
  @UseGuards(GoogleInitGuard)
  google() {
    // The guard redirects to the provider; this body never runs.
    return;
  }

  @ApiOperation({ summary: 'Google OAuth callback' })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleCallback(req, res, AuthProvider.GOOGLE);
  }

  @ApiOperation({ summary: 'Start Facebook OAuth' })
  @Get('facebook')
  @UseGuards(FacebookInitGuard)
  facebook() {
    return;
  }

  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  facebookCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleCallback(req, res, AuthProvider.FACEBOOK);
  }

  @ApiOperation({ summary: 'Start Apple OAuth' })
  @Get('apple')
  @UseGuards(AppleInitGuard)
  apple() {
    return;
  }

  @ApiOperation({ summary: 'Apple OAuth callback (POST)' })
  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  appleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleCallback(req, res, AuthProvider.APPLE);
  }

  @ApiOperation({
    summary: 'Exchange a native OAuth one-time code for a session',
  })
  @RateLimit({
    keyPrefix: 'auth:oauth-exchange',
    points: 15,
    durationSeconds: 60,
  })
  @UseGuards(RateLimitGuard)
  @Post('exchange')
  async exchange(@Body() dto: ExchangeOauthCodeDto, @Req() req: Request) {
    const user = await this.oauth.consumeExchangeCode({
      code: dto.code,
      ip: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    const session = req.session as unknown as SessionData;
    session.userId = user.id;
    session.loginAt = new Date().toISOString();

    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  @ApiOperation({ summary: 'Link Google identity to current user' })
  @ApiCookieAuth()
  @Get('google/link')
  @UseGuards(SessionAuthGuard, AuthGuard('google'))
  async linkGoogle(@Req() req: Request, @CurrentUser() user: { id: string }) {
    const u = req.user as OAuthUserPayload;
    await this.oauth.linkIdentity({
      userId: user.id,
      provider: AuthProvider.GOOGLE,
      providerUserId: u.providerUserId,
      profile: u.profile,
    });
    return { ok: true };
  }

  @ApiOperation({ summary: 'Link Facebook identity to current user' })
  @ApiCookieAuth()
  @Get('facebook/link')
  @UseGuards(SessionAuthGuard, AuthGuard('facebook'))
  async linkFacebook(@Req() req: Request, @CurrentUser() user: { id: string }) {
    const u = req.user as OAuthUserPayload;
    await this.oauth.linkIdentity({
      userId: user.id,
      provider: AuthProvider.FACEBOOK,
      providerUserId: u.providerUserId,
      profile: u.profile,
    });
    return { ok: true };
  }

  @ApiOperation({ summary: 'Link Apple identity to current user' })
  @ApiCookieAuth()
  @Get('apple/link')
  @UseGuards(SessionAuthGuard, AuthGuard('apple'))
  async linkApple(@Req() req: Request, @CurrentUser() user: { id: string }) {
    const u = req.user as OAuthUserPayload;
    await this.oauth.linkIdentity({
      userId: user.id,
      provider: AuthProvider.APPLE,
      providerUserId: u.providerUserId,
      profile: u.profile,
    });
    return { ok: true };
  }
}
