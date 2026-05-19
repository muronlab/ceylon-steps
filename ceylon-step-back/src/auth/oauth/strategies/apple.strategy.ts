import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AppleStrategy = require('passport-apple');

@Injectable()
export class AppleOauthStrategy extends PassportStrategy(AppleStrategy, 'apple') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('APPLE_CLIENT_ID') ?? '',
      teamID: config.get<string>('APPLE_TEAM_ID') ?? '',
      keyID: config.get<string>('APPLE_KEY_ID') ?? '',
      privateKeyString: config.get<string>('APPLE_PRIVATE_KEY') ?? '',
      callbackURL: config.get<string>('APPLE_CALLBACK_URL') ?? '',
      scope: ['name', 'email'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, idToken: any, profile: any, done: any) {
    const providerUserId = idToken?.sub || profile?.id;
    const email = idToken?.email || profile?.email || null;
    done(null, {
      providerUserId,
      email,
      profile: { idToken, profile },
    });
  }
}

