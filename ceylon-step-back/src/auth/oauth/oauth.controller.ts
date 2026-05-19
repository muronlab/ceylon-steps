import { Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { OauthService } from './oauth.service';
import { AuthProvider } from '@prisma/client';
import type { SessionData } from '../auth.types';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

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
    return this.config.get<string>('ADMIN_FRONTEND_URL') ?? 'http://localhost:3001';
  }

  private resolveCallbackUrl(session: SessionData, path = '') {
    const base = session.oauthApp === 'admin' ? this.getAdminUrl() : this.getSiteUrl();
    return `${base}${path}`;
  }

  @ApiOperation({ summary: 'Start Google OAuth' })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  google(@Query('app') app: string | undefined, @Req() req: Request) {
    const session = req.session as unknown as SessionData;
    session.oauthApp = app === 'admin' ? 'admin' : 'site';
    return;
  }

  @ApiOperation({ summary: 'Google OAuth callback' })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const u = req.user as any;
    const session = req.session as unknown as SessionData;
    if (session.userId) {
      await this.oauth.linkIdentity({
        userId: session.userId,
        provider: AuthProvider.GOOGLE,
        providerUserId: u.providerUserId,
        profile: u.profile,
      });
      const target = this.resolveCallbackUrl(session, '/dashboard');
      session.oauthApp = undefined;
      return res.redirect(target);
    }

    const user = await this.oauth.findOrCreateByProvider({
      provider: AuthProvider.GOOGLE,
      providerUserId: u.providerUserId,
      email: u.email,
      profile: u.profile,
    });

    session.userId = user.id;
    (session as any).loginAt = new Date().toISOString();
    const target = this.resolveCallbackUrl(session);
    session.oauthApp = undefined;
    return res.redirect(target);
  }

  @ApiOperation({ summary: 'Start Facebook OAuth' })
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebook() {
    return;
  }

  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const u = req.user as any;
    const session = req.session as unknown as SessionData;
    if (session.userId) {
      await this.oauth.linkIdentity({
        userId: session.userId,
        provider: AuthProvider.FACEBOOK,
        providerUserId: u.providerUserId,
        profile: u.profile,
      });
      return res.redirect(`${this.getSiteUrl()}/dashboard`);
    }

    const user = await this.oauth.findOrCreateByProvider({
      provider: AuthProvider.FACEBOOK,
      providerUserId: u.providerUserId,
      email: u.email,
      profile: u.profile,
    });

    session.userId = user.id;
    (session as any).loginAt = new Date().toISOString();
    return res.redirect(this.getSiteUrl());
  }

  @ApiOperation({ summary: 'Start Apple OAuth' })
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  apple() {
    return;
  }

  @ApiOperation({ summary: 'Apple OAuth callback (POST)' })
  @Post('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Req() req: Request, @Res() res: Response) {
    const u = req.user as any;
    const session = req.session as unknown as SessionData;
    if (session.userId) {
      await this.oauth.linkIdentity({
        userId: session.userId,
        provider: AuthProvider.APPLE,
        providerUserId: u.providerUserId,
        profile: u.profile,
      });
      return res.redirect(`${this.getSiteUrl()}/dashboard`);
    }

    const user = await this.oauth.findOrCreateByProvider({
      provider: AuthProvider.APPLE,
      providerUserId: u.providerUserId,
      email: u.email,
      profile: u.profile,
    });

    session.userId = user.id;
    (session as any).loginAt = new Date().toISOString();
    return res.redirect(this.getSiteUrl());
  }

  @ApiOperation({ summary: 'Link Google identity to current user' })
  @ApiCookieAuth()
  @Get('google/link')
  @UseGuards(SessionAuthGuard, AuthGuard('google'))
  async linkGoogle(@Req() req: Request, @CurrentUser() user: any) {
    const u = req.user as any;
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
  async linkFacebook(@Req() req: Request, @CurrentUser() user: any) {
    const u = req.user as any;
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
  async linkApple(@Req() req: Request, @CurrentUser() user: any) {
    const u = req.user as any;
    await this.oauth.linkIdentity({
      userId: user.id,
      provider: AuthProvider.APPLE,
      providerUserId: u.providerUserId,
      profile: u.profile,
    });
    return { ok: true };
  }
}

