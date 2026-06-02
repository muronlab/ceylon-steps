import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListMessagesQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cursor: return messages strictly older than this message id.',
  })
  @IsOptional()
  @IsUUID()
  before?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
