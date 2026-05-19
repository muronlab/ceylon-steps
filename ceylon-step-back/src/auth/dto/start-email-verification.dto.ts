import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class StartEmailVerificationDto {
  @ApiPropertyOptional({ example: 'user@example.com', description: 'If omitted, uses current session user email' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

