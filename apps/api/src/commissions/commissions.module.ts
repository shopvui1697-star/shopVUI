import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { CommissionsAdminController } from './commissions-admin.controller';
import { CommissionsCronService } from './commissions-cron.service';
import { EmailModule } from '../email/email.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ScheduleModule.forRoot(), EmailModule, NotificationModule],
  controllers: [CommissionsController, CommissionsAdminController],
  providers: [CommissionsService, CommissionsCronService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
