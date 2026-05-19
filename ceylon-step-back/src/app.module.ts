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
import { PublicGuidesController } from './public/public-guides.controller';
import { PublicGuidesService } from './public/public-guides.service';
import { RolesGuard } from './rbac/roles.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StorageModule } from './storage/storage.module';
import { GuideModule } from './partner/guide/guide.module';
import { ApplicationsModule } from './partner/applications/applications.module';
import { TransportProviderModule } from './partner/transport-provider/transport-provider.module';

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
  ],
  controllers: [
    AppController,
    CsrfController,
    AdminController,
    AdminGuidesController,
    AdminTransportProvidersController,
    PublicGuidesController,
  ],
  providers: [
    AppService,
    RolesGuard,
    UsersService,
    GuidesService,
    TransportProvidersService,
    PublicGuidesService,
  ],
})
export class AppModule {}
