import { Module } from '@nestjs/common';
import { ActivityProviderController } from './activity-provider.controller';
import { ActivityItinerariesController } from './activity-itineraries.controller';
import { ActivityProviderService } from './activity-provider.service';
import { ItinerariesService } from '../../admin/itineraries.service';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ActivityProviderController, ActivityItinerariesController],
  providers: [ActivityProviderService, ItinerariesService],
})
export class ActivityProviderModule {}
