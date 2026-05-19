import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
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
} from 'class-validator';

export class UpdateGuideProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  mobileNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsappNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  whatsappAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Public URL of the profile photo.' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  profilePhotoUrl?: string | null;

  @ApiPropertyOptional({ description: 'Public URL of the cover photo.' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  coverPhotoUrl?: string | null;

  @ApiPropertyOptional({ description: 'Free-form biography (markdown allowed).' })
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  bio?: string | null;

  @ApiPropertyOptional({
    description: 'One-word or short phrase about the guide, shown next to the name.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  tagline?: string | null;

  @ApiPropertyOptional({
    description: 'Regions the guide specialises in, e.g. ["Kandy", "Sigiriya"].',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  regionsSpecialized?: string[];

  @ApiPropertyOptional({
    description:
      'Whether this guide profile is publicly listed. When false, only the owner and admins can view it.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Self-reported years of experience as a guide.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  yearsOfExperience?: number | null;

  @ApiPropertyOptional({
    description: 'ISO 4217 currency code (uppercase 3 letters), e.g. "LKR", "USD".',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter uppercase ISO 4217 code.' })
  currency?: string | null;

  @ApiPropertyOptional({ description: 'Hourly rate in `currency`.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerHour?: number | null;

  @ApiPropertyOptional({ description: 'Daily rate in `currency`.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerDay?: number | null;
}
