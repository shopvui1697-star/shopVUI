import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { PriceEngineModule } from './price-engine/price-engine.module';
import { PriceTiersModule } from './price-tiers/price-tiers.module';
import { CouponsModule } from './coupons/coupons.module';
import { AddressesModule } from './addresses/addresses.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { CheckoutModule } from './checkout/checkout.module';
import { PaymentsModule } from './payments/payments.module';
import { ResellersModule } from './resellers/resellers.module';
import { CommissionsModule } from './commissions/commissions.module';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ChannelsModule } from './channels/channels.module';
import { NotificationModule } from './notification/notification.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
      },
    ]),
    EmailModule,
    HealthModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    PriceEngineModule,
    PriceTiersModule,
    CouponsModule,
    AddressesModule,
    CartModule,
    OrdersModule,
    CheckoutModule,
    PaymentsModule,
    ResellersModule,
    CommissionsModule,
    AdminModule,
    WishlistModule,
    ChannelsModule,
    NotificationModule,
    ReviewsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
