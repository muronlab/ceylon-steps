import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('security')
@Controller('security')
export class CsrfController {
  @ApiOperation({ summary: 'Get CSRF token (for cookie-session APIs)' })
  @Get('csrf')
  async getCsrf(@Req() req: any) {
    const token = req.csrfToken();
    // Manually save session to ensure the secret is persisted before the next request
    await new Promise<void>((resolve, reject) => {
      req.session.save((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    return { csrfToken: token };
  }
}

