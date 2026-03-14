import { Module } from '@nestjs/common';
import { CommissionsModule } from '../../commissions/commissions.module';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrdersController } from './admin-orders.controller';

@Module({
  imports: [CommissionsModule],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
  exports: [AdminOrdersService],
})
export class AdminOrdersModule {}
