import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class GuideGalleryImageEntryDto {
  @ApiProperty({ description: 'Public URL of the image.' })
  @IsUrl({ require_tld: false })
  imageUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string | null;

  @ApiPropertyOptional({ description: 'Display order. Lower comes first.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SetGuideGalleryDto {
  @ApiProperty({ type: [GuideGalleryImageEntryDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => GuideGalleryImageEntryDto)
  images!: GuideGalleryImageEntryDto[];
}
