import { Module } from '@nestjs/common';
import { ChannelsModule } from '../../channels/channels.module';
import { AdminChannelsController } from './admin-channels.controller';
import { AdminChannelsService } from './admin-channels.service';

@Module({
  imports: [ChannelsModule],
  controllers: [AdminChannelsController],
  providers: [AdminChannelsService],
})
export class AdminChannelsModule {}
