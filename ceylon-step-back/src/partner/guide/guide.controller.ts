import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { GuideService } from './guide.service';
import { ApplyGuideDto } from './dto/apply-guide.dto';
import { UpdateGuideStatusDto } from './dto/update-guide-status.dto';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

import { Roles } from '../../rbac/roles.decorator';
import { RolesGuard } from '../../rbac/roles.guard';

@ApiTags('partner/guide')
@Controller('partner/guide')
export class GuideController {
  constructor(private readonly guideService: GuideService) {}

  @ApiOperation({ summary: 'Submit a new guide application' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        displayName: { type: 'string' },
        category: { type: 'string' },
        mobileNumber: { type: 'string' },
        whatsappAvailable: { type: 'boolean' },
        address: { type: 'string' },
        nicNumber: { type: 'string' },
        registrationNo: { type: 'string' },
        email: { type: 'string' },
        guideLicenseExpiryDate: { type: 'string' },
        nicFront: { type: 'string', format: 'binary' },
        nicBack: { type: 'string', format: 'binary' },
        guideLicenseFront: { type: 'string', format: 'binary' },
        guideLicenseBack: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(SessionAuthGuard)
  @Post('apply')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'nicFront', maxCount: 1 },
      { name: 'nicBack', maxCount: 1 },
      { name: 'guideLicenseFront', maxCount: 1 },
      { name: 'guideLicenseBack', maxCount: 1 },
    ]),
  )
  async apply(
    @Body() dto: ApplyGuideDto,
    @UploadedFiles()
    files: {
      nicFront?: Express.Multer.File[];
      nicBack?: Express.Multer.File[];
      guideLicenseFront?: Express.Multer.File[];
      guideLicenseBack?: Express.Multer.File[];
    },
    @CurrentUser() user: any,
  ) {
    return this.guideService.apply(dto, files, user.id);
  }

  @ApiOperation({ summary: 'Get all guide applications (Admin only)' })
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  async findAll() {
    return this.guideService.findAll();
  }

  @ApiOperation({ summary: 'Get current user guide application' })
  @UseGuards(SessionAuthGuard)
  @Get('me')
  async getCurrent(@CurrentUser() user: any) {
    return this.guideService.getCurrentByUser(user.id);
  }

  @ApiOperation({ summary: 'Get a specific guide application by ID' })
  @UseGuards(SessionAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.guideService.findOne(id);
  }

  @ApiOperation({ summary: 'Update guide application status (Admin only)' })
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGuideStatusDto,
    @CurrentUser() admin: any,
  ) {
    return this.guideService.updateStatus(id, dto, admin.id);
  }

  @ApiOperation({ summary: 'Update guide application details (Admin only)' })
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiConsumes('multipart/form-data')
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'nicFront', maxCount: 1 },
      { name: 'nicBack', maxCount: 1 },
      { name: 'guideLicenseFront', maxCount: 1 },
      { name: 'guideLicenseBack', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: ApplyGuideDto,
    @UploadedFiles() files: any,
    @CurrentUser() admin: any,
  ) {
    return this.guideService.update(id, dto, files, admin.id);
  }
}
