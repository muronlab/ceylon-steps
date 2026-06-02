import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class MarkReadDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Mark read up to and including this message. Omit to mark the whole conversation read as of now.',
  })
  @IsOptional()
  @IsUUID()
  messageId?: string;
}
