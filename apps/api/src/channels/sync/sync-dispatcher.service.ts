import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { ChannelConnection } from '@shopvui/db';
import { ChannelConnectionService } from '../channel-connection.service';
import { SyncExecutorService } from './sync-executor.service';

@Injectable()
export class SyncDispatcherService {
  private readonly logger = new Logger(SyncDispatcherService.name);
  readonly running = new Set<string>();

  constructor(
    private readonly connectionService: ChannelConnectionService,
    private readonly executor: SyncExecutorService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    const connections = await this.connectionService.findAllEnabled();
    const due = connections.filter((c) => this.isDue(c));

    for (const connection of due) {
      if (this.running.has(connection.id)) {
        this.logger.debug(`Skipping ${connection.id} — already running`);
        continue;
      }

      this.running.add(connection.id);
      this.executor
        .run(connection)
        .catch((err) => this.logger.error(`Sync failed for ${connection.id}: ${err.message}`, err.stack))
        .finally(() => this.running.delete(connection.id));
    }
  }

  async triggerNow(connectionId: string): Promise<string> {
    if (this.running.has(connectionId)) {
      throw new ConflictException('Sync is already running for this connection');
    }

    const connection = await this.connectionService.findById(connectionId);
    this.running.add(connectionId);

    const syncLogId = await this.executor
      .run(connection)
      .finally(() => this.running.delete(connectionId));

    return syncLogId;
  }

  isDue(connection: ChannelConnection): boolean {
    if (!connection.lastSyncAt) return true;
    const elapsed = Date.now() - connection.lastSyncAt.getTime();
    return elapsed >= connection.syncIntervalMinutes * 60_000;
  }
}
