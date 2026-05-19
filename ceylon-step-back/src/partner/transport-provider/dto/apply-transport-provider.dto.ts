import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { TransportProviderType } from '@prisma/client';

function toBool(value: unknown): boolean {
  return value === true || value === 'true';
}

export class ApplyTransportProviderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string;

  @ApiProperty({
    description: 'Sri Lankan mobile number in E.164 format (+947XXXXXXXX).',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+947\d{8}$/, {
    message: 'mobileNumber must be a valid Sri Lankan number (+947XXXXXXXX).',
  })
  mobileNumber!: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => toBool(value))
  @IsOptional()
  @IsBoolean()
  whatsappAvailable?: boolean;

  @ApiProperty()
  @IsEmail()
  contactEmail!: string;

  @ApiPropertyOptional({
    description:
      'Whether the contact email matches the logged-in user account email.',
  })
  @Transform(({ value }) => toBool(value))
  @IsOptional()
  @IsBoolean()
  usesAccountEmail?: boolean;

  @ApiProperty({ enum: TransportProviderType })
  @IsEnum(TransportProviderType)
  providerType!: TransportProviderType;

  @ApiPropertyOptional()
  @Transform(({ value }) => toBool(value))
  @IsOptional()
  @IsBoolean()
  hasBusiness?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  businessDescription?: string;
}
