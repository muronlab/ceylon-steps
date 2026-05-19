import { BadRequestException } from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  it('throws when OTP record missing', async () => {
    const prisma: any = {
      otpCode: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const mail: any = { sendMail: jest.fn() };

    const svc = new OtpService(prisma, mail);
    await expect(svc.verify('user@example.com', OtpPurpose.EMAIL_VERIFY, '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

