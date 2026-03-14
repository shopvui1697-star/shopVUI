import { Module } from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import { AdminProductsController } from './admin-products.controller';
import { STORAGE_ADAPTER } from '../storage/storage.interface';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';

@Module({
  controllers: [AdminProductsController],
  providers: [
    AdminProductsService,
    { provide: STORAGE_ADAPTER, useClass: LocalStorageAdapter },
  ],
  exports: [AdminProductsService],
})
export class AdminProductsModule {}
