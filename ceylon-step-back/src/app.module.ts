import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { CsrfController } from './common/csrf/csrf.controller';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { AdminController } from './admin/admin.controller';
import { UsersService } from './admin/users.service';
import { AdminGuidesController } from './admin/guides.controller';
import { GuidesService } from './admin/guides.service';
import { AdminTransportProvidersController } from './admin/transport-providers.controller';
import { TransportProvidersService } from './admin/transport-providers.service';
import { AdminActivityProvidersController } from './admin/activity-providers.controller';
import { ActivityProvidersService } from './admin/activity-providers.service';
import { PublicGuidesController } from './public/public-guides.controller';
import { PublicGuidesService } from './public/public-guides.service';
import { PublicItinerariesController } from './public/public-itineraries.controller';
import { PublicItinerariesService } from './public/public-itineraries.service';
import { PublicPartnersController } from './public/public-partners.controller';
import { PublicPartnersService } from './public/public-partners.service';
import { RolesGuard } from './rbac/roles.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StorageModule } from './storage/storage.module';
import { GuideModule } from './partner/guide/guide.module';
import { ApplicationsModule } from './partner/applications/applications.module';
import { TransportProviderModule } from './partner/transport-provider/transport-provider.module';
import { ActivityProviderModule } from './partner/activity-provider/activity-provider.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    MailModule,
    AuthModule,
    StorageModule,
    GuideModule,
    ApplicationsModule,
    TransportProviderModule,
    ActivityProviderModule,
    ChatModule,
  ],
  controllers: [
    AppController,
    CsrfController,
    AdminController,
    AdminGuidesController,
    AdminTransportProvidersController,
    AdminActivityProvidersController,
    PublicGuidesController,
    PublicItinerariesController,
    PublicPartnersController,
  ],
  providers: [
    AppService,
    RolesGuard,
    UsersService,
    GuidesService,
    TransportProvidersService,
    ActivityProvidersService,
    PublicGuidesService,
    PublicItinerariesService,
    PublicPartnersService,
  ],
})
export class AppModule {}
