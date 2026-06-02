import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CHAT_EVENTS,
  ChatMessageCreatedEvent,
  ChatMessageDeletedEvent,
  ChatMessageReadEvent,
} from './chat.events';
import { ConversationDto, ConversationListDto } from './dto/conversation.dto';
import { MessageDto, MessageListDto } from './dto/message.dto';

/**
 * Canonical 1:1 pair key: the two user ids sorted and joined. Identity is the
 * stable `m_users.id` (a uuid), never email — so Facebook/Apple logins (where
 * email may be absent or change) map to a single, stable conversation.
 */
export function buildPairKey(a: string, b: string): string {
  return [a, b].sort().join(':');
}

type ParticipantWithUser = Prisma.ConversationParticipantGetPayload<{
  include: { user: { select: { id: true; name: true } } };
}>;

type ConversationWithParticipants = Prisma.ConversationGetPayload<{
  include: {
    participants: { include: { user: { select: { id: true; name: true } } } };
  };
}>;

const PARTICIPANT_INCLUDE = {
  participants: { include: { user: { select: { id: true, name: true } } } },
} satisfies Prisma.ConversationInclude;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // --- Conversations -----------------------------------------------------

  /**
   * Find or create the single 1:1 conversation between the current user and
   * `participantId`. Idempotent and race-safe via the `pairKey` unique index.
   */
  async getOrCreateConversation(
    userId: string,
    participantId: string,
  ): Promise<ConversationDto> {
    if (userId === participantId) {
      throw new BadRequestException(
        'You cannot start a conversation with yourself.',
      );
    }

    const other = await this.prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, status: true },
    });
    if (!other || other.status !== 'ACTIVE') {
      throw new NotFoundException('User not found.');
    }

    const pairKey = buildPairKey(userId, participantId);

    const existing = await this.prisma.conversation.findUnique({
      where: { pairKey },
      include: PARTICIPANT_INCLUDE,
    });
    if (existing) return this.toConversationDto(existing, userId, null, 0);

    try {
      const created = await this.prisma.conversation.create({
        data: {
          pairKey,
          lastMessageAt: new Date(),
          participants: {
            create: [{ userId }, { userId: participantId }],
          },
        },
        include: PARTICIPANT_INCLUDE,
      });
      return this.toConversationDto(created, userId, null, 0);
    } catch (e) {
      // Concurrent create lost the race on the unique pairKey — fetch the winner.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const winner = await this.prisma.conversation.findUnique({
          where: { pairKey },
          include: PARTICIPANT_INCLUDE,
        });
        if (winner) return this.toConversationDto(winner, userId, null, 0);
      }
      throw e;
    }
  }

  async listConversations(
    userId: string,
    limit = 30,
    cursor?: string,
  ): Promise<ConversationListDto> {
    const where: Prisma.ConversationWhereInput = {
      participants: { some: { userId } },
    };
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        where.lastMessageAt = { lt: cursorDate };
      }
    }

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: PARTICIPANT_INCLUDE,
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
    });

    const ids = conversations.map((c) => c.id);
    const [lastMessages, unreadByConversation] = await Promise.all([
      this.latestMessagePerConversation(ids),
      this.unreadCountsForUser(userId, conversations),
    ]);

    const items = conversations.map((c) =>
      this.toConversationDto(
        c,
        userId,
        lastMessages.get(c.id) ?? null,
        unreadByConversation.get(c.id) ?? 0,
      ),
    );

    const last = conversations.at(-1);
    const nextCursor =
      conversations.length === limit && last?.lastMessageAt
        ? last.lastMessageAt.toISOString()
        : null;

    return { items, nextCursor };
  }

  // --- Messages ----------------------------------------------------------

  async listMessages(
    userId: string,
    conversationId: string,
    limit = 30,
    before?: string,
  ): Promise<MessageListDto> {
    await this.assertParticipant(userId, conversationId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    });

    const nextCursor =
      messages.length === limit ? (messages.at(-1)?.id ?? null) : null;

    return { items: messages.map((m) => this.toMessageDto(m)), nextCursor };
  }

  /**
   * Persist a message and bump the conversation's activity timestamp in one
   * transaction, then emit the real-time event for the gateway to broadcast.
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    rawBody: string,
  ): Promise<MessageDto> {
    const conversation = await this.assertParticipant(userId, conversationId);

    const body = rawBody.trim();
    if (!body) throw new BadRequestException('Message cannot be empty.');
    if (body.length > 4000) {
      throw new BadRequestException(
        'Message is too long (max 4000 characters).',
      );
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId, senderId: userId, body },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      });
      return created;
    });

    const dto = this.toMessageDto(message);
    this.eventEmitter.emit(CHAT_EVENTS.messageCreated, {
      conversationId,
      message: dto,
      participantIds: conversation.participants.map((p) => p.userId),
    } satisfies ChatMessageCreatedEvent);

    return dto;
  }

  /** Soft-delete one's own message; content is cleared for privacy. */
  async deleteMessage(userId: string, messageId: string): Promise<MessageDto> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: PARTICIPANT_INCLUDE } },
    });
    if (!message) throw new NotFoundException('Message not found.');
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages.');
    }
    if (message.deletedAt) return this.toMessageDto(message);

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), body: '' },
    });

    const dto = this.toMessageDto(updated);
    this.eventEmitter.emit(CHAT_EVENTS.messageDeleted, {
      conversationId: message.conversationId,
      messageId,
      message: dto,
      participantIds: message.conversation.participants.map((p) => p.userId),
    } satisfies ChatMessageDeletedEvent);

    return dto;
  }

  // --- Read receipts / unread -------------------------------------------

  async markRead(
    userId: string,
    conversationId: string,
    messageId?: string,
  ): Promise<{ lastReadAt: string }> {
    await this.assertParticipant(userId, conversationId);

    let readAt = new Date();
    if (messageId) {
      const message = await this.prisma.message.findFirst({
        where: { id: messageId, conversationId },
        select: { createdAt: true },
      });
      if (!message) throw new NotFoundException('Message not found.');
      readAt = message.createdAt;
    }

    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { lastReadAt: true },
    });
    // Never move the high-water mark backwards.
    if (!participant?.lastReadAt || participant.lastReadAt < readAt) {
      await this.prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: readAt },
      });
    } else {
      readAt = participant.lastReadAt;
    }

    const lastReadAt = readAt.toISOString();
    this.eventEmitter.emit(CHAT_EVENTS.messageRead, {
      conversationId,
      userId,
      lastReadAt,
    } satisfies ChatMessageReadEvent);

    return { lastReadAt };
  }

  async getTotalUnread(userId: string): Promise<number> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });

    const counts = await Promise.all(
      participants.map((p) =>
        this.countUnread(p.conversationId, userId, p.lastReadAt),
      ),
    );
    return counts.reduce((sum, n) => sum + n, 0);
  }

  // --- Authorisation -----------------------------------------------------

  /**
   * Ensure the user is a participant of the conversation, returning it with
   * participants loaded. Throws NotFound (not Forbidden) so the existence of a
   * conversation the user is not in is never revealed.
   */
  async assertParticipant(
    userId: string,
    conversationId: string,
  ): Promise<ConversationWithParticipants> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, participants: { some: { userId } } },
      include: PARTICIPANT_INCLUDE,
    });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    return conversation;
  }

  /**
   * Validate a cookie-session payload for the WebSocket handshake — the socket
   * equivalent of SessionAuthGuard. Returns the user id, or null if the session
   * is missing, the user is gone/disabled, or it predates a session kill switch.
   */
  async authenticateSession(
    userId: string | undefined,
    loginAt: string | undefined,
  ): Promise<string | null> {
    if (!userId) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, sessionInvalidBefore: true },
    });
    if (!user || user.status !== 'ACTIVE') return null;

    const loginDate = loginAt ? new Date(loginAt) : null;
    if (
      user.sessionInvalidBefore &&
      (!loginDate || loginDate < user.sessionInvalidBefore)
    ) {
      return null;
    }
    return user.id;
  }

  // --- Internals ---------------------------------------------------------

  private async latestMessagePerConversation(
    conversationIds: string[],
  ): Promise<Map<string, MessageDto>> {
    if (conversationIds.length === 0) return new Map();
    // DISTINCT ON (conversationId) ORDER BY conversationId, createdAt DESC.
    const rows = await this.prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      distinct: ['conversationId'],
      orderBy: [{ conversationId: 'asc' }, { createdAt: 'desc' }],
    });
    return new Map(rows.map((m) => [m.conversationId, this.toMessageDto(m)]));
  }

  private async unreadCountsForUser(
    userId: string,
    conversations: ConversationWithParticipants[],
  ): Promise<Map<string, number>> {
    const entries = await Promise.all(
      conversations.map(async (c) => {
        const me = c.participants.find((p) => p.userId === userId);
        const count = await this.countUnread(
          c.id,
          userId,
          me?.lastReadAt ?? null,
        );
        return [c.id, count] as const;
      }),
    );
    return new Map(entries);
  }

  private countUnread(
    conversationId: string,
    userId: string,
    lastReadAt: Date | null,
  ): Promise<number> {
    return this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        deletedAt: null,
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
  }

  private toMessageDto(message: {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    createdAt: Date;
    editedAt: Date | null;
    deletedAt: Date | null;
  }): MessageDto {
    const isDeleted = message.deletedAt != null;
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: isDeleted ? null : message.body,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt ? message.editedAt.toISOString() : null,
      deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
      isDeleted,
    };
  }

  private toConversationDto(
    conversation: ConversationWithParticipants,
    currentUserId: string,
    lastMessage: MessageDto | null,
    unreadCount: number,
  ): ConversationDto {
    const peerParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId,
    );
    return {
      id: conversation.id,
      peer: this.toUserSummary(peerParticipant),
      lastMessage,
      unreadCount,
      lastMessageAt: conversation.lastMessageAt
        ? conversation.lastMessageAt.toISOString()
        : null,
      createdAt: conversation.createdAt.toISOString(),
    };
  }

  private toUserSummary(participant?: ParticipantWithUser) {
    return {
      id: participant?.user.id ?? '',
      name: participant?.user.name ?? null,
    };
  }
}
