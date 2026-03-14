import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommissionsService } from './commissions.service';

@Injectable()
export class CommissionsCronService {
  private readonly logger = new Logger(CommissionsCronService.name);

  constructor(private readonly commissionsService: CommissionsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleMaturedCommissions() {
    this.logger.log('Running commission maturity check...');

    try {
      const result = await this.commissionsService.approveMaturedCommissions();
      if (result.approved > 0) {
        this.logger.log(
          `Approved ${result.approved} matured commissions for ${result.resellers.length} reseller(s)`,
        );
      }
    } catch (error) {
      this.logger.error('Commission maturity cron failed', error);
    }
  }
}
