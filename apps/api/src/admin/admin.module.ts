import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminOrdersModule } from './orders/admin-orders.module';
import { AdminProductsModule } from './products/admin-products.module';
import { AdminCouponsModule } from './coupons/admin-coupons.module';
import { AdminCustomersModule } from './customers/admin-customers.module';
import { AdminAnalyticsModule } from './analytics/admin-analytics.module';
import { AdminImportsModule } from './imports/admin-imports.module';
import { AdminResellersModule } from './resellers/admin-resellers.module';
import { AdminChannelsModule } from './channels/admin-channels.module';
import { AdminCategoriesModule } from './categories/admin-categories.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    StorageModule,
    AdminAuthModule,
    AdminOrdersModule,
    AdminProductsModule,
    AdminCouponsModule,
    AdminCustomersModule,
    AdminAnalyticsModule,
    AdminImportsModule,
    AdminResellersModule,
    AdminChannelsModule,
    AdminCategoriesModule,
  ],
})
export class AdminModule {}
