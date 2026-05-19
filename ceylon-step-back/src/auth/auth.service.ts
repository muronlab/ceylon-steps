import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    return this.prisma.user.findUnique({ where: { email } });
  }

  async register(payload: { email: string; password: string; name: string; phone?: string }) {
    const email = payload.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await argon2.hash(payload.password, { type: argon2.argon2id });

    const user = await this.prisma.user.create({
      data: {
        email,
        name: payload.name,
        phone: payload.phone,
        passwordHash,
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
      },
    });

    return user;
  }

  async validateUser(emailRaw: string, password: string) {
    const email = emailRaw.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async resetPassword(emailRaw: string, newPassword: string) {
    const email = emailRaw.trim().toLowerCase();
    const user = await this.findUserByEmail(email);
    if (!user) {
      // caller should respond OK regardless, but service can just no-op
      return null;
    }

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        sessionInvalidBefore: new Date(),
      },
    });
  }
}

