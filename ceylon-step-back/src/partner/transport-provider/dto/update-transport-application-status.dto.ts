import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateTransportApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status!: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Required when rejecting an application.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remark?: string;
}
