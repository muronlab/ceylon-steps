import {
  Body,
  Controller,
  Delete,
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
import { TransportProviderService } from './transport-provider.service';
import { ApplyTransportProviderDto } from './dto/apply-transport-provider.dto';
import { UpdateTransportApplicationStatusDto } from './dto/update-transport-application-status.dto';
import { UpdateTransportProviderProfileDto } from './dto/update-transport-provider-profile.dto';
import { SaveVehicleDto } from './dto/save-vehicle.dto';
import { SaveDriverServiceDto } from './dto/save-driver-service.dto';
import { SaveSafariJeepDto } from './dto/save-safari-jeep.dto';
import {
  ReviewTypeChangeRequestDto,
  SubmitTypeChangeRequestDto,
} from './dto/submit-type-change-request.dto';
import { Query } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';

@ApiTags('partner/transport-provider')
@Controller('partner/transport-provider')
export class TransportProviderController {
  constructor(private readonly service: TransportProviderService) {}

  @ApiOperation({ summary: 'Submit a transport provider application' })
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
        providerType: { type: 'string' },
        hasBusiness: { type: 'boolean' },
        businessName: { type: 'string' },
        businessDescription: { type: 'string' },
        nicFront: { type: 'string', format: 'binary' },
        nicBack: { type: 'string', format: 'binary' },
        brdDocument: { type: 'string', format: 'binary' },
        safariJeepLicense: { type: 'string', format: 'binary' },
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
      { name: 'safariJeepLicense', maxCount: 1 },
    ]),
  )
  async apply(
    @Body() dto: ApplyTransportProviderDto,
    @UploadedFiles()
    files: {
      nicFront?: Express.Multer.File[];
      nicBack?: Express.Multer.File[];
      brdDocument?: Express.Multer.File[];
      safariJeepLicense?: Express.Multer.File[];
    },
    @CurrentUser() user: any,
  ) {
    return this.service.apply(dto, files, user.id);
  }

  @ApiOperation({ summary: 'Get the current user transport application' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return this.service.getCurrentByUser(user.id);
  }

  @ApiOperation({
    summary: 'Get the current user transport provider profile (owner-curated)',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('profile/me')
  async getMyProfile(@CurrentUser() user: any) {
    return this.service.getMyProfile(user.id);
  }

  @ApiOperation({
    summary: 'Update the current user transport provider profile',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Patch('profile/me')
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateTransportProviderProfileDto,
  ) {
    return this.service.updateMyProfile(user.id, dto);
  }

  // ─── Fleet vehicles (VEHICLE_FLEET providers only) ───────────────────

  @ApiOperation({ summary: 'List the fleet vehicles I own' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('vehicles')
  async listMyVehicles(@CurrentUser() user: any) {
    return this.service.listMyVehicles(user.id);
  }

  @ApiOperation({ summary: 'Get one of my fleet vehicles' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('vehicles/:id')
  async getMyVehicle(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.getMyVehicle(user.id, id);
  }

  @ApiOperation({ summary: 'Create a fleet vehicle' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Post('vehicles')
  async createMyVehicle(
    @CurrentUser() user: any,
    @Body() dto: SaveVehicleDto,
  ) {
    return this.service.createMyVehicle(user.id, dto);
  }

  @ApiOperation({ summary: 'Replace a fleet vehicle (full update)' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Put('vehicles/:id')
  async updateMyVehicle(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SaveVehicleDto,
  ) {
    return this.service.updateMyVehicle(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Delete a fleet vehicle' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Delete('vehicles/:id')
  async deleteMyVehicle(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.deleteMyVehicle(user.id, id);
  }

  @ApiOperation({ summary: 'List all transport applications (Admin only)' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get()
  async findAll() {
    return this.service.findAll();
  }

  // ─── Driver services (VEHICLE_WITH_DRIVER providers only) ─────────────

  @ApiOperation({ summary: 'List the driver services I offer' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('driver-services')
  async listMyDriverServices(@CurrentUser() user: any) {
    return this.service.listMyDriverServices(user.id);
  }

  @ApiOperation({ summary: 'Get one of my driver services' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('driver-services/:id')
  async getMyDriverService(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.getMyDriverService(user.id, id);
  }

  @ApiOperation({ summary: 'Create a driver service' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Post('driver-services')
  async createMyDriverService(
    @CurrentUser() user: any,
    @Body() dto: SaveDriverServiceDto,
  ) {
    return this.service.createMyDriverService(user.id, dto);
  }

  @ApiOperation({ summary: 'Replace a driver service (full update)' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Put('driver-services/:id')
  async updateMyDriverService(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SaveDriverServiceDto,
  ) {
    return this.service.updateMyDriverService(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Delete a driver service' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Delete('driver-services/:id')
  async deleteMyDriverService(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.deleteMyDriverService(user.id, id);
  }

  // ─── Safari jeeps (SAFARI_JEEP providers only) ────────────────────────

  @ApiOperation({ summary: 'List the safari jeeps I operate' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('safari-jeeps')
  async listMySafariJeeps(@CurrentUser() user: any) {
    return this.service.listMySafariJeeps(user.id);
  }

  @ApiOperation({ summary: 'Get one of my safari jeeps' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('safari-jeeps/:id')
  async getMySafariJeep(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.getMySafariJeep(user.id, id);
  }

  @ApiOperation({ summary: 'Create a safari jeep' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Post('safari-jeeps')
  async createMySafariJeep(
    @CurrentUser() user: any,
    @Body() dto: SaveSafariJeepDto,
  ) {
    return this.service.createMySafariJeep(user.id, dto);
  }

  @ApiOperation({ summary: 'Replace a safari jeep (full update)' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Put('safari-jeeps/:id')
  async updateMySafariJeep(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SaveSafariJeepDto,
  ) {
    return this.service.updateMySafariJeep(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Delete a safari jeep' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Delete('safari-jeeps/:id')
  async deleteMySafariJeep(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.deleteMySafariJeep(user.id, id);
  }

  // ─── Safari itineraries (built from a safari jeep) ────────────────────

  @ApiOperation({
    summary:
      'Create a new itinerary pre-filled from a safari jeep. Some fields (days, overview) are left for the operator to complete.',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Post('safari-jeeps/:id/create-itinerary')
  async createItineraryFromSafariJeep(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.createItineraryFromSafariJeep(user.id, id);
  }

  @ApiOperation({ summary: 'List itineraries owned by my safari jeeps' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('safari-itineraries')
  async listMySafariItineraries(@CurrentUser() user: any) {
    return this.service.listMySafariItineraries(user.id);
  }

  @ApiOperation({ summary: 'Get one safari itinerary by id' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('safari-itineraries/:id')
  async getMySafariItinerary(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.getMySafariItinerary(user.id, id);
  }

  @ApiOperation({ summary: 'Update a safari itinerary (full replace)' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Put('safari-itineraries/:id')
  async updateMySafariItinerary(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.updateMySafariItinerary(user.id, id, body);
  }

  @ApiOperation({ summary: 'Delete a safari itinerary' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Delete('safari-itineraries/:id')
  async deleteMySafariItinerary(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.deleteMySafariItinerary(user.id, id);
  }

  // ─── Provider type change request (provider side) ─────────────────────

  @ApiOperation({
    summary: 'Get my latest provider type change request (or null)',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Get('profile/me/type-change-request')
  async getMyTypeChangeRequest(@CurrentUser() user: any) {
    return this.service.getMyTypeChangeRequest(user.id);
  }

  @ApiOperation({ summary: 'Submit a provider type change request' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        requestedType: { type: 'string' },
        providerNotes: { type: 'string' },
        safariJeepLicense: { type: 'string', format: 'binary' },
        brdDocument: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Post('profile/me/type-change-request')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'safariJeepLicense', maxCount: 1 },
      { name: 'brdDocument', maxCount: 1 },
    ]),
  )
  async submitMyTypeChangeRequest(
    @CurrentUser() user: any,
    @Body() dto: SubmitTypeChangeRequestDto,
    @UploadedFiles()
    files: {
      safariJeepLicense?: Express.Multer.File[];
      brdDocument?: Express.Multer.File[];
    },
  ) {
    return this.service.submitTypeChangeRequest(user.id, dto, files);
  }

  @ApiOperation({ summary: 'Cancel my pending type change request' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('TRANSPORT_PROVIDER')
  @Delete('profile/me/type-change-request/:id')
  async cancelMyTypeChangeRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.cancelMyTypeChangeRequest(user.id, id);
  }

  // ─── Type change requests (admin) ─────────────────────────────────────

  @ApiOperation({
    summary: 'List all transport provider type change requests (Admin only)',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('type-change-requests')
  async listAllTypeChangeRequests(@Query('status') status?: ApplicationStatus) {
    return this.service.listAllTypeChangeRequests(status);
  }

  @ApiOperation({ summary: 'Get a transport type change request (Admin only)' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('type-change-requests/:id')
  async getTypeChangeRequest(@Param('id') id: string) {
    return this.service.getTypeChangeRequestById(id);
  }

  @ApiOperation({
    summary: 'Approve or reject a transport type change request (Admin only)',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch('type-change-requests/:id/status')
  async reviewTypeChangeRequest(
    @Param('id') id: string,
    @Body() dto: ReviewTypeChangeRequestDto,
    @CurrentUser() admin: any,
  ) {
    return this.service.reviewTypeChangeRequest(id, dto, admin.id);
  }

  // ─── Legacy parametric admin routes ──────────────────────────────────
  // Kept LAST so more-specific paths above (type-change-requests, etc.)
  // win route matching. Express matches in declaration order — putting a
  // bare `:id` earlier would swallow every sibling segment.

  @ApiOperation({ summary: 'Get a specific transport application (Admin only)' })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({
    summary: 'Approve or reject a transport application (Admin only)',
  })
  @ApiCookieAuth()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTransportApplicationStatusDto,
    @CurrentUser() admin: any,
  ) {
    return this.service.updateStatus(id, dto, admin.id);
  }
}
