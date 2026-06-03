import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../rbac/roles.decorator';
import { RolesGuard } from '../../rbac/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ItinerariesService } from '../../admin/itineraries.service';
import { SaveItineraryDto } from '../../admin/dto/save-itinerary.dto';

@ApiTags('partner/activity-provider/itineraries')
@ApiCookieAuth()
@Controller('partner/activity-provider/me/itineraries')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('ACTIVITY_PROVIDER')
export class ActivityItinerariesController {
  constructor(
    private readonly itineraries: ItinerariesService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveOwnProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.activityProviderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException(
        'You do not have an activity provider profile yet.',
      );
    }
    return profile.id;
  }

  @ApiOperation({ summary: "List the logged-in activity provider's itineraries" })
  @Get()
  async list(@CurrentUser() user: any) {
    const id = await this.resolveOwnProfileId(user.id);
    return this.itineraries.list({ activityProviderProfileId: id });
  }

  @ApiOperation({
    summary: "Get one of the logged-in activity provider's itineraries",
  })
  @Get(':itineraryId')
  async get(@CurrentUser() user: any, @Param('itineraryId') itineraryId: string) {
    const id = await this.resolveOwnProfileId(user.id);
    return this.itineraries.getOwned({ activityProviderProfileId: id }, itineraryId);
  }

  @ApiOperation({
    summary: "Create a new itinerary on the logged-in activity provider's profile",
  })
  @Post()
  async create(@CurrentUser() user: any, @Body() dto: SaveItineraryDto) {
    const id = await this.resolveOwnProfileId(user.id);
    return this.itineraries.create({ activityProviderProfileId: id }, dto);
  }

  @ApiOperation({
    summary: 'Update an itinerary owned by the logged-in activity provider',
  })
  @Put(':itineraryId')
  async update(
    @CurrentUser() user: any,
    @Param('itineraryId') itineraryId: string,
    @Body() dto: SaveItineraryDto,
  ) {
    const id = await this.resolveOwnProfileId(user.id);
    return this.itineraries.update(
      { activityProviderProfileId: id },
      itineraryId,
      dto,
    );
  }

  @ApiOperation({
    summary: 'Delete an itinerary owned by the logged-in activity provider',
  })
  @Delete(':itineraryId')
  async remove(@CurrentUser() user: any, @Param('itineraryId') itineraryId: string) {
    const id = await this.resolveOwnProfileId(user.id);
    return this.itineraries.remove({ activityProviderProfileId: id }, itineraryId);
  }
}
