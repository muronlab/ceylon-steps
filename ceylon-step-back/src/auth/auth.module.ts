import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { OtpService } from './otp/otp.service';
import { MailModule } from '../mail/mail.module';
import { OauthController } from './oauth/oauth.controller';
import { OauthService } from './oauth/oauth.service';
import { GoogleStrategy } from './oauth/strategies/google.strategy';
import { FacebookStrategy } from './oauth/strategies/facebook.strategy';
import { AppleOauthStrategy } from './oauth/strategies/apple.strategy';

const hasEnv = (key: string) => (process.env[key] ?? '').trim().length > 0;

const oauthStrategyProviders = [
  ...(hasEnv('GOOGLE_CLIENT_ID') ? [GoogleStrategy] : []),
  ...(hasEnv('FACEBOOK_APP_ID') ? [FacebookStrategy] : []),
  ...(hasEnv('APPLE_CLIENT_ID') && hasEnv('APPLE_TEAM_ID') && hasEnv('APPLE_KEY_ID') && hasEnv('APPLE_PRIVATE_KEY')
    ? [AppleOauthStrategy]
    : []),
];

@Module({
  imports: [MailModule, PassportModule.register({ session: false })],
  controllers: [AuthController, OauthController],
  providers: [
    AuthService,
    SessionAuthGuard,
    RateLimitGuard,
    OtpService,
    OauthService,
    ...oauthStrategyProviders,
  ],
  exports: [AuthService],
})
export class AuthModule {}

