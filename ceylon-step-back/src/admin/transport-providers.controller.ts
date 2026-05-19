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
import { TransportProviderType } from '@prisma/client';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../rbac/roles.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import {
  TransportProvidersService,
  type TransportProviderSort,
} from './transport-providers.service';
import { SetAdminEnabledDto } from './dto/set-admin-enabled.dto';

const SORT_VALUES = new Set<TransportProviderSort>(['newest', 'oldest', 'name-asc']);
const PROVIDER_TYPES = new Set<TransportProviderType>([
  'SAFARI_JEEP',
  'VEHICLE_WITH_DRIVER',
  'VEHICLE_FLEET',
]);

@ApiTags('admin')
@ApiCookieAuth()
@Controller('admin/transport-providers')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminTransportProvidersController {
  constructor(private readonly providers: TransportProvidersService) {}

  @ApiOperation({
    summary: 'Search transport providers (active + inactive, paginated)',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'providerType', required: false, enum: TransportProviderType })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
  })
  @ApiQuery({ name: 'hasBusiness', required: false })
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
    @Query('providerType') providerType?: string,
    @Query('status') status?: string,
    @Query('hasBusiness') hasBusiness?: string,
    @Query('sort') sort?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const parseNum = (v?: string) => {
      if (v === undefined) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const validSort = sort && SORT_VALUES.has(sort as TransportProviderSort)
      ? (sort as TransportProviderSort)
      : undefined;
    const validProvider =
      providerType && PROVIDER_TYPES.has(providerType as TransportProviderType)
        ? (providerType as TransportProviderType)
        : undefined;
    const validStatus =
      status === 'active' || status === 'inactive' ? status : undefined;
    const businessFilter =
      hasBusiness === 'true' ? true : hasBusiness === 'false' ? false : undefined;

    return this.providers.search({
      search,
      providerType: validProvider,
      status: validStatus,
      hasBusiness: businessFilter,
      sort: validSort,
      take: parseNum(take),
      skip: parseNum(skip),
    });
  }

  @ApiOperation({ summary: 'Facets for filter dropdowns' })
  @Get('facets')
  async facets() {
    return this.providers.facets();
  }

  @ApiOperation({ summary: 'Get transport provider by id (full detail)' })
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.providers.detail(id);
  }

  @ApiOperation({ summary: 'Get transport provider by user id' })
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
