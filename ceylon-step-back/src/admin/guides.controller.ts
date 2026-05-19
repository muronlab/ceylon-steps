import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { Roles } from '../rbac/roles.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GuidesService } from './guides.service';
import { UpdateGuideProfileDto } from './dto/update-guide-profile.dto';
import { SetGuideLanguagesDto } from './dto/set-guide-languages.dto';
import { SetGuideGalleryDto } from './dto/set-guide-gallery.dto';
import { SetAdminEnabledDto } from './dto/set-admin-enabled.dto';

@ApiTags('admin')
@ApiCookieAuth()
@Controller('admin/guides')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminGuidesController {
  constructor(private readonly guides: GuidesService) {}

  @ApiOperation({
    summary:
      'Search guide profiles (active + inactive, admin-only fields, paginated)',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'regions', required: false, description: 'Comma-separated.' })
  @ApiQuery({ name: 'languages', required: false, description: 'Comma-separated.' })
  @ApiQuery({ name: 'minExperience', required: false })
  @ApiQuery({ name: 'currency', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['relevance', 'newest', 'experience-desc', 'price-asc', 'price-desc'],
  })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @Get()
  async search(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('regions') regions?: string,
    @Query('languages') languages?: string,
    @Query('minExperience') minExperience?: string,
    @Query('currency') currency?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const parseCsv = (v?: string) =>
      v
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
    const parseNum = (v?: string) => {
      if (v === undefined) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const validSort = (
      ['relevance', 'newest', 'experience-desc', 'price-asc', 'price-desc'] as const
    ).find((s) => s === sort);
    const validStatus =
      status === 'active' || status === 'inactive' ? status : undefined;

    return this.guides.search({
      search,
      category,
      regions: parseCsv(regions),
      languages: parseCsv(languages),
      minExperience: parseNum(minExperience),
      currency: currency?.toUpperCase(),
      minPrice: parseNum(minPrice),
      maxPrice: parseNum(maxPrice),
      status: validStatus,
      sort: validSort,
      take: parseNum(take),
      skip: parseNum(skip),
    });
  }

  @ApiOperation({ summary: 'Filter values currently in use (categories, regions, languages, currencies)' })
  @Get('facets')
  async facets() {
    return this.guides.facets();
  }

  @ApiOperation({ summary: 'Get guide profile by id' })
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.guides.detail(id);
  }

  @ApiOperation({ summary: 'Get guide profile by user id' })
  @Get('by-user/:userId')
  async detailByUser(@Param('userId') userId: string) {
    return this.guides.detailByUserId(userId);
  }

  @ApiOperation({ summary: 'Update guide profile fields' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateGuideProfileDto) {
    return this.guides.updateProfile(id, dto);
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
    return this.guides.setAdminEnabled(user.id, id, dto.adminEnabled);
  }

  @ApiOperation({ summary: 'Replace the full set of languages for this guide' })
  @Put(':id/languages')
  async setLanguages(@Param('id') id: string, @Body() dto: SetGuideLanguagesDto) {
    return this.guides.setLanguages(id, dto);
  }

  @ApiOperation({ summary: 'Replace the full gallery image list for this guide' })
  @Put(':id/gallery')
  async setGallery(@Param('id') id: string, @Body() dto: SetGuideGalleryDto) {
    return this.guides.setGallery(id, dto);
  }
}
