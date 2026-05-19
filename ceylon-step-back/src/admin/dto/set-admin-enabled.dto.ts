import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetAdminEnabledDto {
  @ApiProperty({
    description:
      'Admin-controlled visibility flag. When false, the profile is hidden from the public listing regardless of the owner-controlled isActive flag.',
  })
  @IsBoolean()
  adminEnabled!: boolean;
}
