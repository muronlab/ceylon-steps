import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { PublicApplicationsController } from './public-applications.controller';
import { ApplicationsService } from './applications.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ApplicationsController, PublicApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
