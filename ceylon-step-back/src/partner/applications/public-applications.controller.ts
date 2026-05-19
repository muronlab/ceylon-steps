import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';

@ApiTags('partner/applications/public')
@Controller('partner/applications/public')
export class PublicApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @ApiOperation({ summary: 'Get all possible application status values (Public)' })
  @Get('statuses')
  async getStatuses() {
    return this.applicationsService.getAllStatuses();
  }
}
