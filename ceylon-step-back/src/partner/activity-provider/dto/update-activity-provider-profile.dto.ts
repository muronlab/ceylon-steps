import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
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

  @ApiPropertyOptional({
    description: 'Rich-text (Tiptap HTML) profile description.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(20000)
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
    description: 'Hex colour for the business-name title, e.g. #2563eb. Null clears it.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, {
    message: 'businessNameColor must be a hex colour like #2563eb.',
  })
  businessNameColor?: string | null;

  @ApiPropertyOptional({
    description:
      'Public display name preference. True shows the business name, false the provider name.',
  })
  @IsOptional()
  @IsBoolean()
  displayBusinessName?: boolean;

  @ApiPropertyOptional({
    description:
      'Business email. Null means "same as the provider contact email".',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsEmail()
  businessEmail?: string | null;

  @ApiPropertyOptional({
    description:
      'Business telephone number. Null means "same as the provider mobile number".',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(30)
  businessPhone?: string | null;

  @ApiPropertyOptional({
    description: 'Business address. Null means "same as the provider address".',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500)
  businessAddress?: string | null;

  @ApiPropertyOptional({
    description: 'Self-reported years of experience offering this activity.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  yearsOfExperience?: number | null;

  @ApiPropertyOptional({
    description: 'ISO 4217 currency code (uppercase 3 letters), e.g. "LKR", "USD".',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a 3-letter uppercase ISO 4217 code.',
  })
  currency?: string | null;

  @ApiPropertyOptional({ description: 'Hourly rate in `currency`.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerHour?: number | null;

  @ApiPropertyOptional({ description: 'Daily rate in `currency`.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerDay?: number | null;

  @ApiPropertyOptional({
    description:
      'Owner-controlled visibility flag. False hides the profile from public.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
