import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../rbac/roles.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import {
  ActivityProvidersService,
  type ActivityProviderSort,
} from './activity-providers.service';
import { SetAdminEnabledDto } from './dto/set-admin-enabled.dto';

const SORT_VALUES = new Set<ActivityProviderSort>([
  'newest',
  'oldest',
  'name-asc',
]);

@ApiTags('admin')
@ApiCookieAuth()
@Controller('admin/activity-providers')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminActivityProvidersController {
  constructor(private readonly providers: ActivityProvidersService) {}

  @ApiOperation({
    summary: 'Search activity providers (active + inactive, paginated)',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'oldest', 'name-asc'],
  })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @Get()
  async search(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const parseNum = (v?: string) => {
      if (v === undefined) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const validSort =
      sort && SORT_VALUES.has(sort as ActivityProviderSort)
        ? (sort as ActivityProviderSort)
        : undefined;
    const validStatus =
      status === 'active' || status === 'inactive' ? status : undefined;

    return this.providers.search({
      search,
      status: validStatus,
      sort: validSort,
      take: parseNum(take),
      skip: parseNum(skip),
    });
  }

  @ApiOperation({ summary: 'Get activity provider by id (full detail)' })
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.providers.detail(id);
  }

  @ApiOperation({ summary: 'Get activity provider by user id' })
  @Get('by-user/:userId')
  async detailByUser(@Param('userId') userId: string) {
    return this.providers.detailByUserId(userId);
  }

  @ApiOperation({
    summary:
      'Toggle the admin-controlled visibility flag (independent of the owner-controlled isActive flag)',
  })
  @Patch(':id/admin-enabled')
  async setAdminEnabled(
    @Param('id') id: string,
    @Body() dto: SetAdminEnabledDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.providers.setAdminEnabled(user.id, id, dto.adminEnabled);
  }
}
