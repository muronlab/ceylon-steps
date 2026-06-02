import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatService, buildPairKey } from './chat.service';

describe('buildPairKey', () => {
  it('is canonical regardless of argument order', () => {
    expect(buildPairKey('aaa', 'bbb')).toBe(buildPairKey('bbb', 'aaa'));
  });

  it('joins the two user ids sorted', () => {
    expect(buildPairKey('b', 'a')).toBe('a:b');
  });
});

describe('ChatService', () => {
  const makeService = (prisma: any) =>
    new ChatService(prisma, { emit: jest.fn() } as any);

  it('refuses a conversation with yourself', async () => {
    const svc = makeService({});
    await expect(
      svc.getOrCreateConversation('user-1', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a participant that does not exist', async () => {
    const prisma: any = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    await expect(
      makeService(prisma).getOrCreateConversation('user-1', 'ghost'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a participant that is disabled', async () => {
    const prisma: any = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'user-2', status: 'DISABLED' }),
      },
    };
    await expect(
      makeService(prisma).getOrCreateConversation('user-1', 'user-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('treats a non-participant as conversation-not-found (no leak)', async () => {
    const prisma: any = {
      conversation: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    await expect(
      makeService(prisma).assertParticipant('intruder', 'conv-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('persists a message and emits the real-time event', async () => {
    const created = {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-1',
      body: 'hello',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      editedAt: null,
      deletedAt: null,
    };
    const prisma: any = {
      conversation: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conv-1',
          participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
        }),
      },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
        cb({
          message: { create: jest.fn().mockResolvedValue(created) },
          conversation: { update: jest.fn().mockResolvedValue({}) },
        }),
      ),
    };
    const emitter = { emit: jest.fn() };
    const svc = new ChatService(prisma, emitter as any);

    const dto = await svc.sendMessage('user-1', 'conv-1', '  hello  ');

    expect(dto.id).toBe('msg-1');
    expect(dto.body).toBe('hello');
    expect(emitter.emit).toHaveBeenCalledWith(
      'chat.message.created',
      expect.objectContaining({
        conversationId: 'conv-1',
        participantIds: ['user-1', 'user-2'],
      }),
    );
  });

  it('blocks an empty message', async () => {
    const prisma: any = {
      conversation: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conv-1',
          participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
        }),
      },
    };
    await expect(
      makeService(prisma).sendMessage('user-1', 'conv-1', '   '),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
