import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class VerifyEmailOtpDto {
  @ApiPropertyOptional({ example: 'user@example.com', description: 'If omitted, uses current session user email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 10)
  code!: string;
}

