import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
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
      (p.name &&
      typeof p.name === 'object' &&
      typeof (p.name as { givenName?: string }).givenName === 'string'
        ? (p.name as { givenName?: string }).givenName
        : null);
    if (display) return display;
  }
  if (email) return email.split('@')[0] ?? 'there';
  return 'there';
}

@Injectable()
export class OauthService {
  /// Native clients can only exchange a code within this window. Kept short
  /// because the code is a bearer credential travelling over a deep link.
  private static readonly EXCHANGE_CODE_TTL_MS = 2 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private hashExchangeCode(code: string): string {
    // The code is a 256-bit random token, so a fast one-way hash is sufficient
    // (and correct) for lookup — argon2 is only for low-entropy secrets.
    return createHash('sha256').update(code).digest('hex');
  }

  /// Mint a single-use code for [userId] and return the raw value. Only the
  /// hash is persisted; the raw code is handed to the native client once via
  /// the OAuth deep-link redirect and never stored.
  async issueExchangeCode(userId: string): Promise<string> {
    const code = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + OauthService.EXCHANGE_CODE_TTL_MS);

    await this.prisma.oauthExchangeCode.create({
      data: { codeHash: this.hashExchangeCode(code), userId, expiresAt },
    });

    return code;
  }

  /// Atomically claim and consume an exchange code, returning the owning user.
  /// The claim + audit write happen in one transaction so a code can be redeemed
  /// at most once, even under concurrent requests. Throws [UnauthorizedException]
  /// if the code is unknown, already used, or expired.
  async consumeExchangeCode(params: {
    code: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<{ id: string; email: string; emailVerifiedAt: Date | null }> {
    const { code, ip, userAgent } = params;
    const codeHash = this.hashExchangeCode(code);

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.oauthExchangeCode.updateMany({
        where: { codeHash, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new UnauthorizedException('Invalid or expired code');
      }

      const record = await tx.oauthExchangeCode.findUnique({
        where: { codeHash },
        include: { user: true },
      });
      if (!record?.user) {
        throw new UnauthorizedException('Invalid or expired code');
      }

      await tx.auditLog.create({
        data: {
          action: 'OAUTH_MOBILE_CODE_EXCHANGE',
          userId: record.userId,
          ip: ip ?? undefined,
          userAgent: userAgent ?? undefined,
        },
      });

      const { id, email, emailVerifiedAt } = record.user;
      return { id, email, emailVerifiedAt };
    });
  }

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
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
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
        email:
          normalizedEmail ??
          `oauth_${provider.toLowerCase()}_${providerUserId}@example.invalid`,
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
