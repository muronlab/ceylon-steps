import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TransportProviderType } from '@prisma/client';

export class UpdateTransportProviderProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional({ enum: TransportProviderType })
  @IsOptional()
  @IsEnum(TransportProviderType)
  providerType?: TransportProviderType;

  @ApiPropertyOptional({
    description: 'Sri Lankan mobile number in E.164 format (+947XXXXXXXX).',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+947\d{8}$/, {
    message: 'mobileNumber must be a valid Sri Lankan number (+947XXXXXXXX).',
  })
  mobileNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  whatsappAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasBusiness?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  businessDescription?: string | null;

  @ApiPropertyOptional({ description: 'Public-facing profile photo URL.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl()
  profilePhotoUrl?: string | null;

  @ApiPropertyOptional({ description: 'Public-facing cover photo URL.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl()
  coverPhotoUrl?: string | null;

  @ApiPropertyOptional({
    description:
      'Owner-controlled visibility flag. False hides the profile from public.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
