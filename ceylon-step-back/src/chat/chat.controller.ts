import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { ConversationDto, ConversationListDto } from './dto/conversation.dto';
import { MessageDto, MessageListDto } from './dto/message.dto';

@ApiTags('chat')
@ApiCookieAuth()
@UseGuards(SessionAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @ApiOperation({
    summary: 'Get or create the 1:1 conversation with another user',
  })
  @ApiResponse({ status: 201, type: ConversationDto })
  @Post('conversations')
  createConversation(
    @CurrentUser() user: User,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationDto> {
    return this.chat.getOrCreateConversation(user.id, dto.participantId);
  }

  @ApiOperation({
    summary: "List the current user's conversations (most recent first)",
  })
  @ApiResponse({ status: 200, type: ConversationListDto })
  @Get('conversations')
  listConversations(
    @CurrentUser() user: User,
    @Query() query: ListConversationsQueryDto,
  ): Promise<ConversationListDto> {
    return this.chat.listConversations(
      user.id,
      query.limit ?? 30,
      query.cursor,
    );
  }

  @ApiOperation({
    summary:
      'Get message history for a conversation (newest first, cursor-paged)',
  })
  @ApiResponse({ status: 200, type: MessageListDto })
  @Get('conversations/:id/messages')
  listMessages(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessageListDto> {
    return this.chat.listMessages(
      user.id,
      conversationId,
      query.limit ?? 30,
      query.before,
    );
  }

  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiResponse({ status: 201, type: MessageDto })
  @RateLimit({ keyPrefix: 'chat:send', points: 30, durationSeconds: 10 })
  @UseGuards(RateLimitGuard)
  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageDto> {
    return this.chat.sendMessage(user.id, conversationId, dto.body);
  }

  @ApiOperation({
    summary: 'Mark a conversation read up to a message (or now)',
  })
  @ApiResponse({
    status: 200,
    schema: {
      properties: { lastReadAt: { type: 'string', format: 'date-time' } },
    },
  })
  @Post('conversations/:id/read')
  markRead(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Body() dto: MarkReadDto,
  ): Promise<{ lastReadAt: string }> {
    return this.chat.markRead(user.id, conversationId, dto.messageId);
  }

  @ApiOperation({ summary: 'Soft-delete one of your own messages' })
  @ApiResponse({ status: 200, type: MessageDto })
  @Delete('messages/:id')
  deleteMessage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) messageId: string,
  ): Promise<MessageDto> {
    return this.chat.deleteMessage(user.id, messageId);
  }

  @ApiOperation({
    summary: 'Total unread message count across all conversations',
  })
  @ApiResponse({
    status: 200,
    schema: { properties: { count: { type: 'number' } } },
  })
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
    return { count: await this.chat.getTotalUnread(user.id) };
  }
}
