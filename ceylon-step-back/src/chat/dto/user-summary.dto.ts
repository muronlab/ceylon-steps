import { ApiProperty } from '@nestjs/swagger';

/**
 * The minimal public view of the other participant. Deliberately excludes email
 * and all KYC fields — chat only needs an id (for identity) and a display name.
 */
export class UserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;
}
