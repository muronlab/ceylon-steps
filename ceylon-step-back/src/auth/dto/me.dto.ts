import { ApiProperty } from '@nestjs/swagger';

export class MeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false, nullable: true })
  emailVerifiedAt!: string | null;

  @ApiProperty({ type: [String] })
  roles!: string[];
}

