import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../rbac/roles.decorator';
import { RolesGuard } from '../../rbac/roles.guard';
import { GuidesService } from '../../admin/guides.service';
import { UpdateGuideProfileDto } from '../../admin/dto/update-guide-profile.dto';
import { SetGuideLanguagesDto } from '../../admin/dto/set-guide-languages.dto';
import { SetGuideGalleryDto } from '../../admin/dto/set-guide-gallery.dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('partner/guide-profile')
@ApiCookieAuth()
@Controller('partner/guide-profile')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('GUIDE')
export class GuideProfileController {
  constructor(
    private readonly guides: GuidesService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveOwnProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.guideProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException('You do not have a guide profile yet.');
    }
    return profile.id;
  }

  @ApiOperation({ summary: 'Get the logged-in guide\'s own profile' })
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return this.guides.detailByUserId(user.id);
  }

  @ApiOperation({ summary: 'Update the logged-in guide\'s own profile fields' })
  @Patch('me')
  async updateMe(@CurrentUser() user: any, @Body() dto: UpdateGuideProfileDto) {
    const id = await this.resolveOwnProfileId(user.id);
    return this.guides.updateProfile(id, dto);
  }

  @ApiOperation({ summary: 'Replace the logged-in guide\'s spoken languages' })
  @Put('me/languages')
  async setLanguages(@CurrentUser() user: any, @Body() dto: SetGuideLanguagesDto) {
    const id = await this.resolveOwnProfileId(user.id);
    return this.guides.setLanguages(id, dto);
  }

  @ApiOperation({ summary: 'Replace the logged-in guide\'s gallery images' })
  @Put('me/gallery')
  async setGallery(@CurrentUser() user: any, @Body() dto: SetGuideGalleryDto) {
    const id = await this.resolveOwnProfileId(user.id);
    return this.guides.setGallery(id, dto);
  }
}
