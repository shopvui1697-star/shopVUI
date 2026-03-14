import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { ChannelConnectionService } from '../../channels/channel-connection.service';
import { SyncDispatcherService } from '../../channels/sync/sync-dispatcher.service';

@Injectable()
export class AdminChannelsService {
  private readonly logger = new Logger(AdminChannelsService.name);

  constructor(
    private readonly connectionService: ChannelConnectionService,
    private readonly syncDispatcher: SyncDispatcherService,
  ) {}

  async findAll() {
    return this.connectionService.findAll();
  }

  async triggerSync(connectionId: string) {
    const syncLogId = await this.syncDispatcher.triggerNow(connectionId);
    return { syncLogId };
  }

  async updateSettings(
    connectionId: string,
    data: { syncEnabled?: boolean; syncIntervalMinutes?: number },
  ) {
    if (
      data.syncIntervalMinutes !== undefined &&
      (data.syncIntervalMinutes < 5 || data.syncIntervalMinutes > 15)
    ) {
      throw new BadRequestException('syncIntervalMinutes must be between 5 and 15');
    }

    return this.connectionService.update(connectionId, data);
  }

  async deleteConnection(connectionId: string) {
    return this.connectionService.delete(connectionId);
  }

  async getLogs(connectionId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.syncLog.findMany({
        where: { channelConnectionId: connectionId },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.syncLog.count({
        where: { channelConnectionId: connectionId },
      }),
    ]);

    return {
      data: data.map((log) => ({
        id: log.id,
        status: log.status,
        ordersFetched: log.ordersFetched,
        ordersCreated: log.ordersCreated,
        ordersUpdated: log.ordersUpdated,
        errorType: log.errorType,
        errorMessage: log.errorMessage,
        durationMs: log.durationMs,
        startedAt: log.startedAt.toISOString(),
        completedAt: log.completedAt?.toISOString() ?? null,
      })),
      total,
      page,
      limit,
    };
  }
}
