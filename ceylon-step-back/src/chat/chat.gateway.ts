import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Server, Socket } from 'socket.io';
import { CORS_ORIGINS } from '../bootstrap/cors';
import { buildSessionMiddleware } from '../bootstrap/session';
import { ChatService } from './chat.service';
import { CHAT_EVENTS } from './chat.events';
import type {
  ChatMessageCreatedEvent,
  ChatMessageDeletedEvent,
  ChatMessageReadEvent,
} from './chat.events';

type Ack<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

/** Per-socket state stored on Socket.IO's untyped `socket.data`. */
interface ChatSocketData {
  userId?: string;
  sendTimes?: number[];
}

const SEND_WINDOW_MS = 10_000;
const SEND_MAX_PER_WINDOW = 30;

/**
 * Real-time chat over Socket.IO (namespace `/chat`).
 *
 * Authentication reuses the exact same cookie session as the REST API: the
 * shared session middleware is applied to the Socket.IO handshake, so the `sid`
 * cookie the client already holds authenticates the socket — no separate token.
 *
 * Server → client events: `message:new`, `message:read`, `message:deleted`,
 * `conversation:updated`, `typing`, `presence`.
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: CORS_ORIGINS, credentials: true },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);
  private readonly online = new Map<string, number>();

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly chat: ChatService,
    private readonly config: ConfigService,
  ) {}

  afterInit(server: Server | Namespace) {
    // This gateway uses a namespace, so Nest passes the Namespace here. The
    // engine.io instance (which handles the handshake) lives on the parent io
    // Server and is shared across all namespaces — apply the cookie-session
    // middleware there so sockets authenticate exactly like the REST API.
    const io: Server = 'server' in server ? server.server : server;
    io.engine.use(buildSessionMiddleware(this.config));
  }

  async handleConnection(client: Socket) {
    const request = client.request as unknown as {
      session?: { userId?: string; loginAt?: string };
    };
    const session = request.session;

    const userId = await this.chat.authenticateSession(
      session?.userId,
      session?.loginAt,
    );
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      client.disconnect(true);
      return;
    }

    const data = this.data(client);
    data.userId = userId;
    data.sendTimes = [];
    void client.join(this.userRoom(userId));
    this.addPresence(userId);

    client.on('disconnecting', () => this.onDisconnecting(client));
  }

  // --- Client → server ---------------------------------------------------

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ): Promise<Ack<{ conversationId: string }>> {
    const userId = this.data(client).userId;
    if (!userId) return this.fail('Not authenticated');
    const conversationId = body?.conversationId;
    if (!conversationId) return this.fail('conversationId is required');

    try {
      const conversation = await this.chat.assertParticipant(
        userId,
        conversationId,
      );
      const room = this.conversationRoom(conversationId);
      void client.join(room);

      // Tell the peer (if present in the room) that this user is online, and
      // tell this client whether the peer is currently online.
      client.to(room).emit('presence', { userId, online: true });
      const peer = conversation.participants.find((p) => p.userId !== userId);
      if (peer) {
        client.emit('presence', {
          userId: peer.userId,
          online: this.isOnline(peer.userId),
        });
      }
      return this.success({ conversationId });
    } catch (e) {
      return this.fail(this.errorMessage(e));
    }
  }

  @SubscribeMessage('conversation:leave')
  leaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ): Ack<{ conversationId: string }> {
    const conversationId = body?.conversationId;
    if (!conversationId) return this.fail('conversationId is required');
    void client.leave(this.conversationRoom(conversationId));
    return this.success({ conversationId });
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string; body?: string },
  ): Promise<Ack> {
    const userId = this.data(client).userId;
    if (!userId) return this.fail('Not authenticated');
    if (!body?.conversationId || !body.body) {
      return this.fail('conversationId and body are required');
    }
    if (!this.allowSend(client)) {
      return this.fail(
        'You are sending messages too quickly. Please slow down.',
      );
    }

    try {
      const message = await this.chat.sendMessage(
        userId,
        body.conversationId,
        body.body,
      );
      // The service emits chat.message.created → broadcast happens in @OnEvent.
      return this.success(message);
    } catch (e) {
      return this.fail(this.errorMessage(e));
    }
  }

  @SubscribeMessage('message:read')
  async markRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string; messageId?: string },
  ): Promise<Ack> {
    const userId = this.data(client).userId;
    if (!userId) return this.fail('Not authenticated');
    if (!body?.conversationId) return this.fail('conversationId is required');
    try {
      const result = await this.chat.markRead(
        userId,
        body.conversationId,
        body.messageId,
      );
      return this.success(result);
    } catch (e) {
      return this.fail(this.errorMessage(e));
    }
  }

  @SubscribeMessage('typing:start')
  typingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ): void {
    this.broadcastTyping(client, body?.conversationId, true);
  }

  @SubscribeMessage('typing:stop')
  typingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ): void {
    this.broadcastTyping(client, body?.conversationId, false);
  }

  @SubscribeMessage('presence:check')
  presenceCheck(
    @MessageBody() body: { userIds?: string[] },
  ): Ack<Record<string, boolean>> {
    const ids = Array.isArray(body?.userIds) ? body.userIds : [];
    const result: Record<string, boolean> = {};
    for (const id of ids) result[id] = this.isOnline(id);
    return this.success(result);
  }

  // --- Service events → broadcast ---------------------------------------

  @OnEvent(CHAT_EVENTS.messageCreated)
  onMessageCreated(event: ChatMessageCreatedEvent) {
    this.server
      .to(this.conversationRoom(event.conversationId))
      .emit('message:new', event.message);

    // Nudge each participant's conversation list / unread badge.
    for (const userId of event.participantIds) {
      this.server.to(this.userRoom(userId)).emit('conversation:updated', {
        conversationId: event.conversationId,
        lastMessage: event.message,
      });
    }
  }

  @OnEvent(CHAT_EVENTS.messageRead)
  onMessageRead(event: ChatMessageReadEvent) {
    this.server
      .to(this.conversationRoom(event.conversationId))
      .emit('message:read', event);
  }

  @OnEvent(CHAT_EVENTS.messageDeleted)
  onMessageDeleted(event: ChatMessageDeletedEvent) {
    this.server
      .to(this.conversationRoom(event.conversationId))
      .emit('message:deleted', event.message);
    for (const userId of event.participantIds) {
      this.server.to(this.userRoom(userId)).emit('conversation:updated', {
        conversationId: event.conversationId,
        lastMessage: event.message,
      });
    }
  }

  // --- Internals ---------------------------------------------------------

  private broadcastTyping(
    client: Socket,
    conversationId: string | undefined,
    isTyping: boolean,
  ) {
    if (!conversationId) return;
    const room = this.conversationRoom(conversationId);
    // Only relay typing for rooms the socket has actually joined (and thus been
    // authorised for) — avoids a DB hit on every keystroke.
    if (!client.rooms.has(room)) return;
    client.to(room).emit('typing', {
      conversationId,
      userId: this.data(client).userId,
      isTyping,
    });
  }

  private onDisconnecting(client: Socket) {
    const userId = this.data(client).userId;
    if (!userId) return;

    const becameOffline = this.removePresence(userId);
    if (!becameOffline) return;

    for (const room of client.rooms) {
      if (room.startsWith('conversation:')) {
        client.to(room).emit('presence', { userId, online: false });
      }
    }
  }

  private allowSend(client: Socket): boolean {
    const now = Date.now();
    const data = this.data(client);
    const times = data.sendTimes ?? [];
    const recent = times.filter((t) => now - t < SEND_WINDOW_MS);
    if (recent.length >= SEND_MAX_PER_WINDOW) {
      data.sendTimes = recent;
      return false;
    }
    recent.push(now);
    data.sendTimes = recent;
    return true;
  }

  private data(client: Socket): ChatSocketData {
    return client.data as ChatSocketData;
  }

  private addPresence(userId: string) {
    this.online.set(userId, (this.online.get(userId) ?? 0) + 1);
  }

  private removePresence(userId: string): boolean {
    const next = (this.online.get(userId) ?? 1) - 1;
    if (next <= 0) {
      this.online.delete(userId);
      return true;
    }
    this.online.set(userId, next);
    return false;
  }

  private isOnline(userId: string): boolean {
    return (this.online.get(userId) ?? 0) > 0;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private conversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private success<T>(data: T): Ack<T> {
    return { ok: true, data };
  }

  private fail(error: string): Ack<never> {
    return { ok: false, error };
  }

  private errorMessage(e: unknown): string {
    if (e && typeof e === 'object' && 'message' in e) {
      const msg = e.message;
      if (typeof msg === 'string') return msg;
    }
    this.logger.error('Unexpected chat gateway error', e as any);
    return 'Something went wrong.';
  }
}
