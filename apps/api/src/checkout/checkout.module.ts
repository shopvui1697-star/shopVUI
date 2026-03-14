import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { CartModule } from '../cart/cart.module';
import { CouponsModule } from '../coupons/coupons.module';
import { PriceEngineModule } from '../price-engine/price-engine.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [CartModule, CouponsModule, PriceEngineModule, OrdersModule, PaymentsModule, CommissionsModule, EmailModule],
  providers: [CheckoutService],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
