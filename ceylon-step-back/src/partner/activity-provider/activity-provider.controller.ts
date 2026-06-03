import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../rbac/roles.decorator';
import { RolesGuard } from '../../rbac/roles.guard';
import { ActivityProviderService } from './activity-provider.service';
import { ApplyActivityProviderDto } from './dto/apply-activity-provider.dto';
import { UpdateActivityApplicationStatusDto } from './dto/update-activity-application-status.dto';
import { UpdateActivityProviderProfileDto } from './dto/update-activity-provider-profile.dto';
import { SetActivityGalleryDto } from './dto/set-activity-gallery.dto';
import { SetActivityLanguagesDto } from './dto/set-activity-languages.dto';

@ApiTags('partner/activity-provider')
@Controller('partner/activity-provider')
export class ActivityProviderController {
  constructor(private readonly service: ActivityProviderService) {}

  @ApiOperation({ summary: 'Submit an activity provider application' })
  @ApiCookieAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        mobileNumber: { type: 'string' },
        whatsappAvailable: { type: 'boolean' },
        contactEmail: { type: 'string' },
        usesAccountEmail: { type: 'boolean' },
        nicNumber: { type: 'string' },
        businessName: { type: 'string' },
        natureOfBusiness: { type: 'string' },
        description: { type: 'string' },
        address: { type: 'string' },
        nicFront: { type: 'string', format: 'binary' },
        nicBack: { type: 'string', format: 'binary' },
        brdDocument: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(SessionAuthGuard)
  @Post('apply')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'nicFront', maxCount: 1 },
      { name: 'nicBack', maxCount: 1 },
      { name: 'brdDocument', maxCount: 1 },
    ]),
  )
  async apply(
    @Body() dto: ApplyActivityProviderDto,
    @UploadedFiles()
    files: {
      nicFront?: Express.Multer.File[];
      nicBack?: Express.Multer.File[];
      brdDocument?: Express.Multer.File[];
    },
    @CurrentUser() user: any,
  ) {
    return this.service.apply(dto, files, user.id);
  }

  @ApiOperation({ summary: 'Get the current user activity application' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return this.service.getCurrentByUser(user.id);
  }

  @ApiOperation({
    summary: 'Get the current user activity provider profile (owner-curated)',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ACTIVITY_PROVIDER')
  @Get('profile/me')
  async getMyProfile(@CurrentUser() user: any) {
    return this.service.getMyProfile(user.id);
  }

  @ApiOperation({
    summary: 'Update the current user activity provider profile',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ACTIVITY_PROVIDER')
  @Patch('profile/me')
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateActivityProviderProfileDto,
  ) {
    return this.service.updateMyProfile(user.id, dto);
  }

  @ApiOperation({
    summary: "Replace the logged-in activity provider's spoken/service languages",
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ACTIVITY_PROVIDER')
  @Put('profile/me/languages')
  async setLanguages(
    @CurrentUser() user: any,
    @Body() dto: SetActivityLanguagesDto,
  ) {
    return this.service.setLanguages(user.id, dto);
  }

  @ApiOperation({
    summary: "Replace the logged-in activity provider's gallery images",
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ACTIVITY_PROVIDER')
  @Put('profile/me/gallery')
  async setGallery(
    @CurrentUser() user: any,
    @Body() dto: SetActivityGalleryDto,
  ) {
    return this.service.setGallery(user.id, dto);
  }

  @ApiOperation({ summary: 'List all activity applications (Admin only)' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get a specific activity application (Admin only)' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({
    summary: 'Approve or reject an activity application (Admin only)',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateActivityApplicationStatusDto,
    @CurrentUser() admin: any,
  ) {
    return this.service.updateStatus(id, dto, admin.id);
  }
}
