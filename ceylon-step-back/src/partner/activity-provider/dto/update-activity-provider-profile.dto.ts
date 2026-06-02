import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateActivityProviderProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

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
  @ValidateIf((_, v) => v !== null)
  @IsEmail()
  contactEmail?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  natureOfBusiness?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

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
