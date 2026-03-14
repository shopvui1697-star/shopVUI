import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { prisma } from '@shopvui/db';

@Injectable()
export class SyncLogCleanupService {
  private readonly logger = new Logger(SyncLogCleanupService.name);

  @Cron('0 0 * * *') // Daily at midnight
  async cleanupOldLogs(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.syncLog.deleteMany({
      where: {
        startedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} sync logs older than 30 days`);
  }
}
