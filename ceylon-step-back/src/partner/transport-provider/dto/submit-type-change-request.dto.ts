import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TransportProviderType } from '@prisma/client';

/**
 * Multipart form payload. Files come in as Express.Multer.File on the
 * controller — only text fields are validated here.
 */
export class SubmitTypeChangeRequestDto {
  @ApiProperty({ enum: TransportProviderType })
  @IsEnum(TransportProviderType)
  requestedType!: TransportProviderType;

  @ApiPropertyOptional({
    description: 'Provider note explaining why they want to switch.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  providerNotes?: string;
}

export class ReviewTypeChangeRequestDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'] as const)
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({
    description:
      'Required when rejecting. Optional remark when approving (audit note).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remark?: string;
}
