import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { AdminChannelsService } from './admin-channels.service';

vi.mock('@shopvui/db', () => {
  const mockPrisma = {
    syncLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@shopvui/db';

const mockPrisma = prisma as any;

describe('AdminChannelsService', () => {
  let service: AdminChannelsService;
  const mockConnectionService = {
    findAll: vi.fn().mockResolvedValue([
      { id: 'conn-1', channel: 'SHOPEE', shopName: 'Shop 1', syncEnabled: true },
    ]),
    update: vi.fn().mockResolvedValue({ id: 'conn-1', syncIntervalMinutes: 15 }),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  const mockDispatcher = {
    triggerNow: vi.fn().mockResolvedValue('log-1'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminChannelsService(
      mockConnectionService as any,
      mockDispatcher as any,
    );
  });

  it('should trigger manual sync and return syncLogId with 202', async () => {
    const result = await service.triggerSync('conn-1');

    expect(mockDispatcher.triggerNow).toHaveBeenCalledWith('conn-1');
    expect(result).toEqual({ syncLogId: 'log-1' });
  });

  it('should throw 409 when sync is already running', async () => {
    mockDispatcher.triggerNow.mockRejectedValue(
      new ConflictException('Sync is already running'),
    );

    await expect(service.triggerSync('conn-1')).rejects.toThrow(ConflictException);
  });

  it('should update sync interval', async () => {
    const result = await service.updateSettings('conn-1', { syncIntervalMinutes: 15 });

    expect(mockConnectionService.update).toHaveBeenCalledWith('conn-1', {
      syncIntervalMinutes: 15,
    });
    expect(result.syncIntervalMinutes).toBe(15);
  });

  it('should reject invalid sync interval', async () => {
    await expect(
      service.updateSettings('conn-1', { syncIntervalMinutes: 30 }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.updateSettings('conn-1', { syncIntervalMinutes: 1 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update sync enabled', async () => {
    await service.updateSettings('conn-1', { syncEnabled: false });

    expect(mockConnectionService.update).toHaveBeenCalledWith('conn-1', {
      syncEnabled: false,
    });
  });

  it('should return paginated logs', async () => {
    const logs = [
      {
        id: 'log-1',
        status: 'SUCCESS',
        ordersFetched: 5,
        ordersCreated: 3,
        ordersUpdated: 2,
        errorType: null,
        errorMessage: null,
        durationMs: 1500,
        startedAt: new Date('2026-03-12T10:00:00Z'),
        completedAt: new Date('2026-03-12T10:00:01Z'),
      },
    ];
    mockPrisma.syncLog.findMany.mockResolvedValue(logs);
    mockPrisma.syncLog.count.mockResolvedValue(25);

    const result = await service.getLogs('conn-1', 2, 10);

    expect(mockPrisma.syncLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { channelConnectionId: 'conn-1' },
        skip: 10,
        take: 10,
      }),
    );
    expect(result.total).toBe(25);
    expect(result.page).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].startedAt).toBe('2026-03-12T10:00:00.000Z');
  });
});
