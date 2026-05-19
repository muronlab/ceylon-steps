import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from '@prisma/client';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { RolesGuard } from '../../rbac/roles.guard';
import { Roles } from '../../rbac/roles.decorator';

@ApiTags('partner/applications')
@Controller('partner/applications')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @ApiOperation({ summary: 'Get all partner applications across all types (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @Get()
  async findAll(@Query('status') status?: ApplicationStatus) {
    return this.applicationsService.findAll(status);
  }

  @ApiOperation({ summary: 'Paginated guide applications (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @Get('guides')
  async listGuideApplications(
    @Query('status') status?: ApplicationStatus,
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.applicationsService.findGuideApplications({
      status,
      search,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
  }

  @ApiOperation({ summary: 'Paginated transport-provider applications (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @Get('transport-providers')
  async listTransportApplications(
    @Query('status') status?: ApplicationStatus,
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.applicationsService.findTransportApplications({
      status,
      search,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
  }


  @ApiOperation({ summary: 'Get status summary counts grouped by status (Admin only)' })
  @Get('summary')
  async getStatusSummary() {
    return this.applicationsService.getStatusSummary();
  }

  @ApiOperation({
    summary:
      'Pending application counts by partner type (Admin only). Polled by the admin sidebar to surface review badges.',
  })
  @Get('pending-counts')
  async getPendingCounts() {
    return this.applicationsService.getPendingCounts();
  }

  @ApiOperation({ summary: 'Get full status history for a specific application (Admin only)' })
  @Get(':id/status-history')
  async getStatusHistory(@Param('id') id: string) {
    return this.applicationsService.getStatusHistory(id);
  }
}
