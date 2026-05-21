import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Optional overrides for the title/subtitle when snapshotting a safari jeep
 * into a fresh itinerary. The frontend generates template suggestions from
 * the jeep's national parks + experiences and lets the operator pick one
 * (or type their own) before the draft is created — so the draft already
 * has a meaningful name on the first save.
 *
 * Both fields are optional: if omitted, the service falls back to the
 * jeep's own title and a "with <driver>" subtitle.
 */
export class CreateSafariItineraryFromJeepDto {
  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ maxLength: 240, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  subtitle?: string | null;
}
