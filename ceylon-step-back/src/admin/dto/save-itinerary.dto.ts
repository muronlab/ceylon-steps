import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ItineraryDesignType,
  ItineraryInclusionKind,
  ItineraryPriceScope,
} from '@prisma/client';

export class ItineraryDayDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dayNumber!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ description: 'Rich-text HTML for what happens on this day / slot.' })
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  description?: string | null;

  @ApiPropertyOptional({ description: 'HH:mm — used when the parent itinerary designType is TIME.' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:mm 24-hour format.',
  })
  startTime?: string | null;

  @ApiPropertyOptional({ description: 'HH:mm — used when the parent itinerary designType is TIME.' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be in HH:mm 24-hour format.',
  })
  endTime?: string | null;
}

export class ItineraryInclusionDto {
  @ApiProperty({ enum: ItineraryInclusionKind })
  @IsEnum(ItineraryInclusionKind)
  kind!: ItineraryInclusionKind;

  @ApiProperty()
  @IsString()
  @MaxLength(280)
  text!: string;
}

export class ItineraryImageDto {
  @ApiProperty()
  @IsUrl({ require_tld: false })
  imageUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string | null;
}

export class SaveItineraryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  subtitle?: string | null;

  @ApiPropertyOptional({ enum: ItineraryDesignType })
  @IsOptional()
  @IsEnum(ItineraryDesignType)
  designType?: ItineraryDesignType;

  @ApiPropertyOptional({
    description:
      'Languages this itinerary is offered in. Defaults to the guide’s spoken languages on creation.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  languagesOffered?: string[];

  @ApiPropertyOptional({
    description:
      'Free-form hashtags (without #), used for searchability. Stored lowercase + deduplicated.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationDays?: number | null;

  @ApiPropertyOptional({
    description:
      'Total duration in minutes — used when designType is DURATION (e.g. 240 for "4 hours"). Null for DAYS / TIME.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(43_200)
  durationMinutes?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  durationLabel?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ description: 'ISO 4217 currency code (uppercase 3 letters).' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter uppercase ISO 4217 code.' })
  currency?: string | null;

  @ApiPropertyOptional({ enum: ItineraryPriceScope })
  @IsOptional()
  @IsEnum(ItineraryPriceScope)
  priceScope?: ItineraryPriceScope;

  @ApiPropertyOptional({ description: 'Rich-text HTML overview.' })
  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  overview?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  transportation?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  meetingLocation?: string | null;

  @ApiPropertyOptional({ description: 'Tailwind class name preset for the card gradient.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageGradient?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  coverImageUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [ItineraryDayDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  days?: ItineraryDayDto[];

  @ApiPropertyOptional({ type: [ItineraryInclusionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ItineraryInclusionDto)
  inclusions?: ItineraryInclusionDto[];

  @ApiPropertyOptional({ type: [ItineraryImageDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ItineraryImageDto)
  galleryImages?: ItineraryImageDto[];
}
