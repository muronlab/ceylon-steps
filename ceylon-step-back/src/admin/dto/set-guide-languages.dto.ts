import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LanguageLevel } from '@prisma/client';

export class GuideLanguageEntryDto {
  @ApiProperty({ description: 'Language name, e.g. English, Sinhala, Tamil.' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  language!: string;

  @ApiProperty({ enum: LanguageLevel })
  @IsEnum(LanguageLevel)
  level!: LanguageLevel;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-2 country code (uppercase), e.g. "GB", "LK".',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter uppercase ISO code.' })
  countryCode?: string | null;
}

export class SetGuideLanguagesDto {
  @ApiProperty({ type: [GuideLanguageEntryDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => GuideLanguageEntryDto)
  languages!: GuideLanguageEntryDto[];
}
