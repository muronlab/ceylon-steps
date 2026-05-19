import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../rbac/roles.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { UsersService } from './users.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import type { UserStatus } from '@prisma/client';

function actorContext(user: any) {
  const roles: string[] = (user.roles ?? [])
    .map((ur: any) => ur.role?.name)
    .filter((name: unknown): name is string => typeof name === 'string');
  return { id: user.id as string, roles };
}

@ApiTags('admin')
@ApiCookieAuth()
@Controller('admin')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: 'List users (ADMIN or SUPER_ADMIN)' })
  @Get('users')
  async listUsers(
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.users.list({
      search,
      status,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
  }

  @ApiOperation({ summary: 'Get user detail' })
  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.users.detail(id);
  }

  @ApiOperation({ summary: 'Activate or deactivate a user' })
  @Patch('users/:id/status')
  async setStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.users.setStatus(actorContext(user), id, dto.status);
  }

  @ApiOperation({ summary: 'Assign roles to a user (only SUPER_ADMIN may grant/revoke ADMIN)' })
  @Patch('users/:id/roles')
  async setRoles(
    @Param('id') id: string,
    @Body() dto: UpdateUserRolesDto,
    @CurrentUser() user: any,
  ) {
    return this.users.setRoles(actorContext(user), id, dto.roles);
  }
}
