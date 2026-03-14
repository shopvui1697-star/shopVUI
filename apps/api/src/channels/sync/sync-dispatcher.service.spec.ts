import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { SyncDispatcherService } from './sync-dispatcher.service';

const makeConnection = (overrides = {}) => ({
  id: 'conn-1',
  channel: 'SHOPEE',
  shopId: 'shop-123',
  shopName: 'My Shop',
  syncEnabled: true,
  syncIntervalMinutes: 10,
  lastSyncAt: null as Date | null,
  lastSyncStatus: 'IDLE',
  encryptedAccessToken: 'enc-at',
  encryptedRefreshToken: 'enc-rt',
  tokenExpiresAt: new Date('2026-04-01'),
  createdById: 'admin-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('SyncDispatcherService', () => {
  let dispatcher: SyncDispatcherService;
  const mockConnectionService = {
    findAllEnabled: vi.fn(),
    findById: vi.fn(),
  };
  const mockExecutor = {
    run: vi.fn().mockResolvedValue('log-1'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dispatcher = new SyncDispatcherService(
      mockConnectionService as any,
      mockExecutor as any,
    );
  });

  it('should dispatch due connections', async () => {
    const conn = makeConnection({
      lastSyncAt: new Date(Date.now() - 15 * 60_000), // 15 min ago
      syncIntervalMinutes: 10,
    });
    mockConnectionService.findAllEnabled.mockResolvedValue([conn]);

    await dispatcher.tick();

    expect(mockExecutor.run).toHaveBeenCalledWith(conn);
  });

  it('should skip non-due connections', async () => {
    const conn = makeConnection({
      lastSyncAt: new Date(Date.now() - 5 * 60_000), // 5 min ago
      syncIntervalMinutes: 10,
    });
    mockConnectionService.findAllEnabled.mockResolvedValue([conn]);

    await dispatcher.tick();

    expect(mockExecutor.run).not.toHaveBeenCalled();
  });

  it('should skip connections already running (concurrency guard)', async () => {
    const conn = makeConnection({
      lastSyncAt: new Date(Date.now() - 15 * 60_000),
    });
    mockConnectionService.findAllEnabled.mockResolvedValue([conn]);
    dispatcher.running.add(conn.id);

    await dispatcher.tick();

    expect(mockExecutor.run).not.toHaveBeenCalled();
  });

  it('should dispatch connections with null lastSyncAt (never synced)', async () => {
    const conn = makeConnection({ lastSyncAt: null });
    mockConnectionService.findAllEnabled.mockResolvedValue([conn]);

    await dispatcher.tick();

    expect(mockExecutor.run).toHaveBeenCalledWith(conn);
  });

  it('should trigger manual sync bypassing schedule', async () => {
    const conn = makeConnection({
      lastSyncAt: new Date(Date.now() - 1 * 60_000), // 1 min ago, not due
      syncIntervalMinutes: 10,
    });
    mockConnectionService.findById.mockResolvedValue(conn);

    const logId = await dispatcher.triggerNow('conn-1');

    expect(mockExecutor.run).toHaveBeenCalledWith(conn);
    expect(logId).toBe('log-1');
  });

  it('should throw 409 when manual trigger hits concurrency guard', async () => {
    dispatcher.running.add('conn-1');

    await expect(dispatcher.triggerNow('conn-1')).rejects.toThrow(ConflictException);
    expect(mockExecutor.run).not.toHaveBeenCalled();
  });
});
