import { Module } from '@nestjs/common';
import { TransportProviderController } from './transport-provider.controller';
import { TransportProviderService } from './transport-provider.service';
import { StorageModule } from '../../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [TransportProviderController],
  providers: [TransportProviderService],
})
export class TransportProviderModule {}
