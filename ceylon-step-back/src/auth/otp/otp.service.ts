import { BadRequestException, Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpPurpose } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

function generateNumericOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async start(emailRaw: string, purpose: OtpPurpose, userId?: string) {
    const email = emailRaw.trim().toLowerCase();
    const code = generateNumericOtp(6);
    const codeHash = await argon2.hash(code, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // best-effort: remove old unconsumed OTPs for this email/purpose
    await this.prisma.otpCode.deleteMany({
      where: { email, purpose, consumedAt: null },
    });

    await this.prisma.otpCode.create({
      data: {
        email,
        userId,
        purpose,
        codeHash,
        expiresAt,
      },
    });

    this.eventEmitter.emit('auth.otp.send', { email, code });
    return { ok: true };
  }

  async verify(emailRaw: string, purpose: OtpPurpose, code: string) {
    const email = emailRaw.trim().toLowerCase();

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        email,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw new BadRequestException('OTP invalid or expired');
    if (otp.attempts >= 5) throw new BadRequestException('OTP invalid or expired');

    const ok = await argon2.verify(otp.codeHash, code);
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: {
        attempts: { increment: 1 },
        ...(ok ? { consumedAt: new Date() } : {}),
      },
    });

    if (!ok) throw new BadRequestException('OTP invalid or expired');
    return otp;
  }
}

