import { Module } from '@nestjs/common';
import { ActivityProviderController } from './activity-provider.controller';
import { ActivityProviderService } from './activity-provider.service';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ActivityProviderController],
  providers: [ActivityProviderService],
})
export class ActivityProviderModule {}
