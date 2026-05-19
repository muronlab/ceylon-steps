import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('FACEBOOK_APP_ID') ?? '',
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET') ?? '',
      callbackURL: config.get<string>('FACEBOOK_CALLBACK_URL') ?? '',
      profileFields: ['id', 'emails', 'name', 'displayName'],
      scope: 'email',
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: any, done: any) {
    const email = profile?.emails?.[0]?.value ?? null;
    done(null, {
      providerUserId: profile.id,
      email,
      profile,
    });
  }
}

