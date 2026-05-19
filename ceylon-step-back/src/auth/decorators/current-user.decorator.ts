import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User | null => {
  const req = ctx.switchToHttp().getRequest();
  return (req.user as User | undefined) ?? null;
});

