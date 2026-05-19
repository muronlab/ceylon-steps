import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsIn } from 'class-validator';

export const ASSIGNABLE_ROLES = ['ADMIN', 'GUIDE'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export class UpdateUserRolesDto {
  @ApiProperty({
    description:
      'Final set of assignable roles for the user. USER and SUPER_ADMIN cannot be modified via this endpoint.',
    isArray: true,
    enum: ASSIGNABLE_ROLES,
  })
  @IsArray()
  @ArrayUnique()
  @IsIn(ASSIGNABLE_ROLES, { each: true })
  roles!: AssignableRole[];
}
