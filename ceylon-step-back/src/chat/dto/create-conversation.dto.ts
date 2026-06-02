import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'The other account holder to start a 1:1 conversation with (m_users.id). Identity is the stable user id, never email.',
  })
  @IsUUID()
  participantId!: string;
}
