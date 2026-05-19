import { Module } from '@nestjs/common';
import { GuideService } from './guide.service';
import { GuideController } from './guide.controller';
import { GuideProfileController } from './guide-profile.controller';
import { GuideItinerariesController } from './guide-itineraries.controller';
import { GuidesService } from '../../admin/guides.service';
import { ItinerariesService } from '../../admin/itineraries.service';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [
    GuideController,
    GuideProfileController,
    GuideItinerariesController,
  ],
  providers: [GuideService, GuidesService, ItinerariesService],
})
export class GuideModule {}
