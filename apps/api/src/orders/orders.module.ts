import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CommissionsModule } from '../commissions/commissions.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [forwardRef(() => CommissionsModule), EmailModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
