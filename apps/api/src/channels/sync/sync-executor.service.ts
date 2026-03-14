import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import type { ChannelConnection, ChannelType } from '@shopvui/db';
import { ChannelConnectionService } from '../channel-connection.service';
import type { ChannelAdapter } from '../adapters/channel-adapter.interface';
import { OrderMapperService } from './order-mapper.service';
import { RateLimitError, NetworkError, SyncError } from './errors';

@Injectable()
export class SyncExecutorService {
  private readonly logger = new Logger(SyncExecutorService.name);
  private readonly adapters = new Map<string, ChannelAdapter>();

  constructor(
    private readonly connectionService: ChannelConnectionService,
    private readonly orderMapper: OrderMapperService,
  ) {}

  registerAdapter(channel: ChannelType, adapter: ChannelAdapter): void {
    this.adapters.set(channel, adapter);
  }

  async run(connection: ChannelConnection): Promise<string> {
    const startTime = Date.now();

    const syncLog = await prisma.syncLog.create({
      data: {
        channelConnectionId: connection.id,
        status: 'RUNNING',
      },
    });

    await prisma.channelConnection.update({
      where: { id: connection.id },
      data: { lastSyncStatus: 'RUNNING' },
    });

    try {
      const adapter = this.adapters.get(connection.channel);
      if (!adapter) {
        throw new Error(`No adapter registered for channel: ${connection.channel}`);
      }

      const refreshedConnection = await adapter.refreshTokenIfNeeded(connection);

      const since = connection.lastSyncAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
      const externalOrders = await this.withRetry(() =>
        adapter.fetchOrders(since, refreshedConnection),
      );

      let ordersCreated = 0;
      let ordersUpdated = 0;

      for (const extOrder of externalOrders) {
        const orderData = this.orderMapper.mapOrder(extOrder, connection.channel);

        const existing = await prisma.order.findFirst({
          where: {
            externalOrderId: extOrder.externalOrderId,
            channel: connection.channel.toLowerCase(),
          },
        });

        if (existing) {
          await prisma.order.update({
            where: { id: existing.id },
            data: {
              status: orderData.status,
              paymentStatus: orderData.paymentStatus,
              customerName: orderData.customerName,
              customerPhone: orderData.customerPhone,
            },
          });
          ordersUpdated++;
        } else {
          const orderNumber = await this.generateOrderNumber(connection.channel);
          await prisma.order.create({
            data: {
              orderNumber,
              externalOrderId: extOrder.externalOrderId,
              channel: connection.channel.toLowerCase(),
              customerName: orderData.customerName,
              customerPhone: orderData.customerPhone,
              customerEmail: orderData.customerEmail,
              status: orderData.status,
              paymentMethod: orderData.paymentMethod,
              paymentStatus: orderData.paymentStatus,
              subtotal: orderData.subtotal,
              shippingFee: orderData.shippingFee,
              discountAmount: orderData.discountAmount,
              total: orderData.total,
              items: {
                create: orderData.items,
              },
            },
          });
          ordersCreated++;
        }
      }

      const durationMs = Date.now() - startTime;

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          ordersFetched: externalOrders.length,
          ordersCreated,
          ordersUpdated,
          durationMs,
          completedAt: new Date(),
        },
      });

      await prisma.channelConnection.update({
        where: { id: connection.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'SUCCESS',
        },
      });

      this.logger.log(
        `Sync completed for ${connection.channel}/${connection.shopId}: ` +
          `fetched=${externalOrders.length}, created=${ordersCreated}, updated=${ordersUpdated}, duration=${durationMs}ms`,
      );

      return syncLog.id;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const syncError = error instanceof SyncError ? error : null;

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorType: syncError?.errorType ?? 'network_error',
          errorMessage: syncError?.humanMessage ?? (error as Error).message,
          durationMs,
          completedAt: new Date(),
        },
      });

      await prisma.channelConnection.update({
        where: { id: connection.id },
        data: { lastSyncStatus: 'FAILED' },
      });

      this.logger.error(
        `Sync failed for ${connection.channel}/${connection.shopId}: ${(error as Error).message}`,
        (error as Error).stack,
      );

      return syncLog.id;
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (error instanceof RateLimitError || error instanceof NetworkError) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          this.logger.warn(
            `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms: ${(error as Error).message}`,
          );
          await this.sleep(delay);
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async generateOrderNumber(channel: ChannelType): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const prefix = `SV-${dateStr}-`;
    const lastOrder = await prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.split('-').pop() ?? '0', 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }
}
