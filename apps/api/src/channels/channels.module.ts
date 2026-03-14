import { Module, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { CredentialEncryptionService } from './encryption/credential-encryption.service';
import { ChannelConnectionService } from './channel-connection.service';
import { SyncDispatcherService } from './sync/sync-dispatcher.service';
import { SyncExecutorService } from './sync/sync-executor.service';
import { OrderMapperService } from './sync/order-mapper.service';
import { ShopeeAdapter } from './adapters/shopee.adapter';
import { TikTokAdapter } from './adapters/tiktok.adapter';
import { SyncLogCleanupService } from './sync/sync-log-cleanup.service';
import { OAuthService } from './oauth/oauth.service';
import { OAuthController } from './oauth/oauth.controller';

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule],
  controllers: [OAuthController],
  providers: [
    CredentialEncryptionService,
    ChannelConnectionService,
    SyncDispatcherService,
    SyncExecutorService,
    OrderMapperService,
    ShopeeAdapter,
    TikTokAdapter,
    SyncLogCleanupService,
    OAuthService,
    OAuthController,
  ],
  exports: [
    ChannelConnectionService,
    SyncDispatcherService,
    CredentialEncryptionService,
  ],
})
export class ChannelsModule implements OnModuleInit {
  constructor(
    private readonly executor: SyncExecutorService,
    private readonly oauthController: OAuthController,
    private readonly shopeeAdapter: ShopeeAdapter,
    private readonly tiktokAdapter: TikTokAdapter,
  ) {}

  onModuleInit() {
    // Register adapters
    this.executor.registerAdapter('SHOPEE' as any, this.shopeeAdapter);
    this.oauthController.registerAdapter('SHOPEE', this.shopeeAdapter);
    this.executor.registerAdapter('TIKTOK' as any, this.tiktokAdapter);
    this.oauthController.registerAdapter('TIKTOK', this.tiktokAdapter);
  }
}
