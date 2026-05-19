import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { SessionAuthGuard } from './guards/session-auth.guard';
import type { SessionData } from './auth.types';
import { MeDto } from './dto/me.dto';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { OtpService } from './otp/otp.service';
import { OtpPurpose } from '@prisma/client';
import { StartEmailVerificationDto } from './dto/start-email-verification.dto';
import { VerifyEmailOtpDto } from './dto/verify-email-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly otp: OtpService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @ApiOperation({ summary: 'Register with email/password (starts email verification OTP)' })
  @RateLimit({ keyPrefix: 'auth:register', points: 10, durationSeconds: 60 })
  @UseGuards(RateLimitGuard)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const user = await this.auth.register(dto);

    const session = req.session as unknown as SessionData;
    session.userId = user.id;
    (session as any).loginAt = new Date().toISOString();

    await this.otp.start(user.email, OtpPurpose.EMAIL_VERIFY, user.id);

    this.eventEmitter.emit('auth.welcome.send', {
      email: user.email,
      name: user.name || dto.name || 'there',
    });

    return { id: user.id, email: user.email, emailVerifiedAt: user.emailVerifiedAt };
  }

  @ApiOperation({ summary: 'Login with email/password' })
  @RateLimit({ keyPrefix: 'auth:login', points: 15, durationSeconds: 60 })
  @UseGuards(RateLimitGuard)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.auth.validateUser(dto.email, dto.password);

    const session = req.session as unknown as SessionData;
    session.userId = user.id;
    (session as any).loginAt = new Date().toISOString();

    return { id: user.id, email: user.email, emailVerifiedAt: user.emailVerifiedAt };
  }

  @ApiOperation({ summary: 'Logout (destroy session)' })
  @Post('logout')
  async logout(@Req() req: Request) {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });
    return { ok: true };
  }

  @ApiOperation({ summary: 'Get current session user' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any): MeDto {
    const roles: string[] = (user.roles ?? [])
      .map((ur: any) => ur.role?.name)
      .filter((name: unknown): name is string => typeof name === 'string');

    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
      roles,
    };
  }

  @ApiOperation({ summary: 'Re-send email verification OTP' })
  @ApiCookieAuth()
  @RateLimit({ keyPrefix: 'auth:email:start', points: 5, durationSeconds: 60 })
  @UseGuards(RateLimitGuard, SessionAuthGuard)
  @Post('email/start-verification')
  async startEmailVerification(@Body() dto: StartEmailVerificationDto, @CurrentUser() user: any) {
    const email = dto.email?.trim().toLowerCase() || user.email;
    await this.otp.start(email, OtpPurpose.EMAIL_VERIFY, user.id);
    return { ok: true };
  }

  @ApiOperation({ summary: 'Verify email OTP and mark email as verified' })
  @ApiCookieAuth()
  @RateLimit({ keyPrefix: 'auth:email:verify', points: 10, durationSeconds: 60 })
  @UseGuards(RateLimitGuard, SessionAuthGuard)
  @Post('email/verify-otp')
  async verifyEmailOtp(@Body() dto: VerifyEmailOtpDto, @CurrentUser() user: any) {
    const email = dto.email?.trim().toLowerCase() || user.email;
    const otp = await this.otp.verify(email, OtpPurpose.EMAIL_VERIFY, dto.code);

    if (!otp.userId || otp.userId !== user.id) {
      // avoid verifying someone else's email via guessing
      throw new BadRequestException('OTP invalid or expired');
    }

    const updated = await this.auth.markEmailVerified(user.id);

    return { id: updated.id, email: updated.email, emailVerifiedAt: updated.emailVerifiedAt };
  }

  @ApiOperation({ summary: 'Start forgot password (sends OTP if email exists)' })
  @RateLimit({ keyPrefix: 'auth:password:forgot', points: 5, durationSeconds: 60 })
  @UseGuards(RateLimitGuard)
  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.auth.findUserByEmail(email);
    if (user) {
      await this.otp.start(email, OtpPurpose.PASSWORD_RESET, user.id);
    }
    return { ok: true };
  }

  @ApiOperation({ summary: 'Reset password using OTP' })
  @RateLimit({ keyPrefix: 'auth:password:reset', points: 10, durationSeconds: 60 })
  @UseGuards(RateLimitGuard)
  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const email = dto.email.trim().toLowerCase();
    await this.otp.verify(email, OtpPurpose.PASSWORD_RESET, dto.code);
    const updated = await this.auth.resetPassword(email, dto.newPassword);
    // Always 200 to avoid user enumeration
    if (!updated) return { ok: true };

    // logout current session too
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => (err ? reject(err) : resolve()));
    });

    return { ok: true };
  }
}

