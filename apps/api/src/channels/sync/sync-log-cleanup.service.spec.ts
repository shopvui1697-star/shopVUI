import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shopvui/db', () => {
  const mockPrisma = {
    syncLog: {
      deleteMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@shopvui/db';
import { SyncLogCleanupService } from './sync-log-cleanup.service';

const mockPrisma = prisma as any;

describe('SyncLogCleanupService', () => {
  let service: SyncLogCleanupService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SyncLogCleanupService();
  });

  it('should delete logs older than 30 days', async () => {
    mockPrisma.syncLog.deleteMany.mockResolvedValue({ count: 15 });

    await service.cleanupOldLogs();

    expect(mockPrisma.syncLog.deleteMany).toHaveBeenCalledWith({
      where: {
        startedAt: {
          lt: expect.any(Date),
        },
      },
    });

    const callArg = mockPrisma.syncLog.deleteMany.mock.calls[0][0];
    const cutoffDate = callArg.where.startedAt.lt;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const expectedCutoff = Date.now() - thirtyDaysMs;

    // Allow 5 seconds tolerance
    expect(Math.abs(cutoffDate.getTime() - expectedCutoff)).toBeLessThan(5000);
  });

  it('should preserve recent logs (cutoff is 30 days)', async () => {
    mockPrisma.syncLog.deleteMany.mockResolvedValue({ count: 0 });

    await service.cleanupOldLogs();

    const callArg = mockPrisma.syncLog.deleteMany.mock.calls[0][0];
    const cutoffDate = callArg.where.startedAt.lt;

    // Cutoff should be ~30 days ago, not recent
    expect(cutoffDate.getTime()).toBeLessThan(Date.now() - 29 * 24 * 60 * 60 * 1000);
  });

  it('should handle empty table without error', async () => {
    mockPrisma.syncLog.deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.cleanupOldLogs()).resolves.not.toThrow();
  });
});
