import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  DriverServiceCategory,
  DriverServicePriceUnit,
} from '@prisma/client';

export class SaveDriverServiceDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ enum: DriverServiceCategory, default: 'OTHER' })
  @IsOptional()
  @IsEnum(DriverServiceCategory)
  category?: DriverServiceCategory;

  @ApiPropertyOptional({ description: 'Tiptap HTML.' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ description: 'Cover image URL for the service card.' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsUrl()
  coverImageUrl?: string | null;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({ default: 'LKR' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiProperty({ enum: DriverServicePriceUnit })
  @IsEnum(DriverServicePriceUnit)
  priceUnit!: DriverServicePriceUnit;

  @ApiPropertyOptional({
    description:
      'Free-form qualifier ("min 4 hrs", "up to 4 passengers", etc.).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  priceNotes?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  inclusions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  exclusions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
