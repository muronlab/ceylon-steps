import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, SessionAuthGuard, RateLimitGuard],
})
export class ChatModule {}
