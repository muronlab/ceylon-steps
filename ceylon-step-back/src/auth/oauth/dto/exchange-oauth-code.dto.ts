import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

/// Body for `POST /auth/oauth/exchange`. The native client posts the one-time
/// code it received on the OAuth deep-link redirect to open a session.
export class ExchangeOauthCodeDto {
  @ApiProperty({
    description: 'Single-use code from the OAuth deep-link redirect',
  })
  @IsString()
  @Length(16, 512)
  code!: string;
}
