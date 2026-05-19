import { Injectable } from '@nestjs/common';
import { AuthProvider, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

function isSyntheticOauthEmail(email: string | null | undefined): boolean {
  return !email || email.endsWith('@example.invalid');
}

function nameFromProfile(profile: unknown, email: string | null): string {
  if (profile && typeof profile === 'object') {
    const p = profile as Record<string, unknown>;
    const display =
      (typeof p.displayName === 'string' && p.displayName) ||
      (typeof p.name === 'string' && p.name) ||
      (p.name && typeof p.name === 'object' && typeof (p.name as { givenName?: string }).givenName === 'string'
        ? (p.name as { givenName?: string }).givenName
        : null);
    if (display) return display;
  }
  if (email) return email.split('@')[0] ?? 'there';
  return 'there';
}

@Injectable()
export class OauthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findOrCreateByProvider(params: {
    provider: AuthProvider;
    providerUserId: string;
    email?: string | null;
    profile?: Prisma.JsonValue;
  }) {
    const { provider, providerUserId, email, profile } = params;

    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
      include: { user: true },
    });
    if (existingIdentity) return existingIdentity.user;

    const normalizedEmail = email?.trim().toLowerCase() || null;
    if (normalizedEmail) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        await this.prisma.authIdentity.create({
          data: {
            provider,
            providerUserId,
            profile: profile ?? undefined,
            userId: existingUser.id,
          },
        });
        return existingUser;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail ?? `oauth_${provider.toLowerCase()}_${providerUserId}@example.invalid`,
        emailVerifiedAt: normalizedEmail ? new Date() : null,
        roles: {
          create: [
            {
              role: {
                connectOrCreate: {
                  where: { name: 'USER' },
                  create: { name: 'USER' },
                },
              },
            },
          ],
        },
        identities: {
          create: [
            {
              provider,
              providerUserId,
              profile: profile ?? undefined,
            },
          ],
        },
      },
    });

    if (!isSyntheticOauthEmail(user.email)) {
      this.eventEmitter.emit('auth.welcome.send', {
        email: user.email,
        name: nameFromProfile(profile, user.email),
      });
    }

    return user;
  }

  async linkIdentity(params: {
    userId: string;
    provider: AuthProvider;
    providerUserId: string;
    profile?: Prisma.JsonValue;
  }) {
    const { userId, provider, providerUserId, profile } = params;
    return this.prisma.authIdentity.upsert({
      where: { provider_providerUserId: { provider, providerUserId } },
      update: {
        userId,
        profile: profile ?? undefined,
      },
      create: {
        userId,
        provider,
        providerUserId,
        profile: profile ?? undefined,
      },
    });
  }
}

