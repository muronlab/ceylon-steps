import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

function toBool(value: unknown): boolean {
  return value === true || value === 'true';
}

/** Multipart string fields arrive as "" when left blank — treat that as absent. */
function emptyToUndefined(value: unknown): unknown {
  return value === '' ? undefined : value;
}

export class ApplyActivityProviderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string;

  @ApiProperty({
    description: 'Sri Lankan mobile number in E.164 format (+947XXXXXXXX).',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+947\d{8}$/, {
    message: 'mobileNumber must be a valid Sri Lankan number (+947XXXXXXXX).',
  })
  mobileNumber!: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => toBool(value))
  @IsOptional()
  @IsBoolean()
  whatsappAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Optional public contact email.' })
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined)
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description:
      'Whether the contact email matches the logged-in user account email.',
  })
  @Transform(({ value }) => toBool(value))
  @IsOptional()
  @IsBoolean()
  usesAccountEmail?: boolean;

  @ApiProperty({ description: 'Sri Lanka NIC (9 digits + V/X, or 12 digits).' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\d{9}[VvXx]|\d{12})$/, {
    message: 'nicNumber must be a valid Sri Lankan NIC.',
  })
  nicNumber!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  businessName!: string;

  @ApiProperty({ description: 'What the business offers.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  natureOfBusiness!: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address!: string;
}
