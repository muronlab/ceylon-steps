import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { SessionData } from '../auth.types';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const session = req.session as unknown as SessionData | undefined;

    const userId = session?.userId;
    if (!userId) throw new UnauthorizedException('Not authenticated');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Invalid session');

    const loginAt = (session as any).loginAt ? new Date((session as any).loginAt) : null;
    if (user.sessionInvalidBefore && (!loginAt || loginAt < user.sessionInvalidBefore)) {
      throw new UnauthorizedException('Session expired');
    }

    (req as unknown as { user?: unknown }).user = user;
    return true;
  }
}

