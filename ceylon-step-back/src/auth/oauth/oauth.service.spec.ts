import { UnauthorizedException } from '@nestjs/common';
import { OauthService } from './oauth.service';

describe('OauthService.consumeExchangeCode', () => {
  const eventEmitter: any = { emit: jest.fn() };

  it('rejects an unknown / expired / already-used code (no row claimed)', async () => {
    const tx = {
      oauthExchangeCode: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };
    const prisma: any = {
      $transaction: (cb: (t: typeof tx) => unknown) => cb(tx),
    };
    const svc = new OauthService(prisma, eventEmitter);

    await expect(
      svc.consumeExchangeCode({ code: 'whatever-code-value' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    // Nothing was claimed → no audit row should be written.
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it('claims the code, writes an audit row, and returns the user', async () => {
    const user = {
      id: 'u1',
      email: 'traveller@example.com',
      emailVerifiedAt: null,
    };
    const tx = {
      oauthExchangeCode: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({ userId: 'u1', user }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma: any = {
      $transaction: (cb: (t: typeof tx) => unknown) => cb(tx),
    };
    const svc = new OauthService(prisma, eventEmitter);

    const result = await svc.consumeExchangeCode({
      code: 'a-valid-single-use-code',
      ip: '203.0.113.5',
      userAgent: 'CeylonSteps/1.0',
    });

    expect(result).toEqual(user);
    // Single-use: the code is claimed exactly once via the guarded updateMany.
    expect(tx.oauthExchangeCode.updateMany).toHaveBeenCalledTimes(1);
    // Audit row records the actor + request metadata, no PII in the action.
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'OAUTH_MOBILE_CODE_EXCHANGE',
        userId: 'u1',
        ip: '203.0.113.5',
        userAgent: 'CeylonSteps/1.0',
      },
    });
  });
});
