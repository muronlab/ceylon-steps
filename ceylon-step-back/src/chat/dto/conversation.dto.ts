import { ApiProperty } from '@nestjs/swagger';
import { MessageDto } from './message.dto';
import { UserSummaryDto } from './user-summary.dto';

export class ConversationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: UserSummaryDto, description: 'The other participant.' })
  peer!: UserSummaryDto;

  @ApiProperty({ type: MessageDto, nullable: true })
  lastMessage!: MessageDto | null;

  @ApiProperty({ description: 'Messages the current user has not yet read.' })
  unreadCount!: number;

  @ApiProperty({ format: 'date-time', nullable: true })
  lastMessageAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class ConversationListDto {
  @ApiProperty({
    type: [ConversationDto],
    description: 'Most recent activity first.',
  })
  items!: ConversationDto[];

  @ApiProperty({
    nullable: true,
    description: 'Pass as `cursor` to fetch the next page. Null when no more.',
  })
  nextCursor!: string | null;
}
