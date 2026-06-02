import { MessageDto } from './dto/message.dto';

/**
 * Internal event names emitted by ChatService and consumed by ChatGateway.
 * Keeping the gateway decoupled from the service (via EventEmitter2) avoids a
 * circular dependency and mirrors the existing `auth.*` event usage.
 */
export const CHAT_EVENTS = {
  messageCreated: 'chat.message.created',
  messageRead: 'chat.message.read',
  messageDeleted: 'chat.message.deleted',
} as const;

export interface ChatMessageCreatedEvent {
  conversationId: string;
  message: MessageDto;
  participantIds: string[];
}

export interface ChatMessageReadEvent {
  conversationId: string;
  userId: string;
  lastReadAt: string;
}

export interface ChatMessageDeletedEvent {
  conversationId: string;
  messageId: string;
  message: MessageDto;
  participantIds: string[];
}
