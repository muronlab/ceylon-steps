import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ format: 'uuid' })
  senderId!: string;

  @ApiProperty({
    nullable: true,
    description: 'Message text. Null when the message has been deleted.',
  })
  body!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  editedAt!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true })
  deletedAt!: string | null;

  @ApiProperty()
  isDeleted!: boolean;
}

export class MessageListDto {
  @ApiProperty({ type: [MessageDto], description: 'Newest first.' })
  items!: MessageDto[];

  @ApiProperty({
    nullable: true,
    description:
      'Pass as `before` to fetch the next (older) page. Null when no more.',
  })
  nextCursor!: string | null;
}
