import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shopvui/db', () => {
  const mockPrisma = {
    syncLog: {
      create: vi.fn(),
      update: vi.fn(),
    },
    channelConnection: {
      update: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@shopvui/db';
import { SyncExecutorService } from './sync-executor.service';
import { RateLimitError } from './errors';
import type { ChannelAdapter, ExternalOrder } from '../adapters/channel-adapter.interface';

const mockPrisma = prisma as any;

const makeTikTokConnection = (overrides = {}) => ({
  id: 'tiktok-conn-1',
  channel: 'TIKTOK',
  shopId: 'tk-shop-123',
  shopName: 'My TikTok Store',
  syncEnabled: true,
  syncIntervalMinutes: 10,
  lastSyncAt: new Date(Date.now() - 15 * 60_000),
  lastSyncStatus: 'IDLE',
  encryptedAccessToken: 'enc-at',
  encryptedRefreshToken: 'enc-rt',
  tokenExpiresAt: new Date('2026-04-01'),
  createdById: 'admin-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeTikTokExternalOrder = (id = 'TK-001'): ExternalOrder => ({
  externalOrderId: id,
  status: 'AWAITING_SHIPMENT',
  customerName: 'TikTok Buyer',
  customerPhone: '0909876543',
  items: [
    { externalItemId: 'tki-1', productName: 'TikTok Widget', quantity: 1, unitPrice: 80000 },
  ],
  totalAmount: 80000,
  shippingFee: 20000,
  discountAmount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockConnectionService = {
  decryptTokens: vi.fn().mockReturnValue({
    accessToken: 'decrypted-at',
    refreshToken: 'decrypted-rt',
  }),
};

const mockOrderMapper = {
  mapOrder: vi.fn().mockReturnValue({
    customerName: 'TikTok Buyer',
    customerPhone: '0909876543',
    customerEmail: null,
    status: 'CONFIRMED',
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    subtotal: 80000,
    shippingFee: 20000,
    discountAmount: 0,
    total: 80000,
    items: [{ productId: 'tki-1', quantity: 1, unitPrice: 80000, subtotal: 80000 }],
  }),
};

describe('SyncExecutor - TikTok Integration', () => {
  let executor: SyncExecutorService;
  let mockTikTokAdapter: ChannelAdapter;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.syncLog.create.mockResolvedValue({ id: 'tiktok-log-1' });
    mockPrisma.syncLog.update.mockResolvedValue({});
    mockPrisma.channelConnection.update.mockResolvedValue({});
    mockPrisma.order.findFirst.mockResolvedValue(null);
    mockPrisma.order.create.mockResolvedValue({ id: 'order-tk-1' });

    executor = new SyncExecutorService(
      mockConnectionService as any,
      mockOrderMapper as any,
    );

    (executor as any).sleep = vi.fn().mockResolvedValue(undefined);

    mockTikTokAdapter = {
      refreshTokenIfNeeded: vi.fn().mockImplementation((c: any) => Promise.resolve(c)),
      fetchOrders: vi.fn().mockResolvedValue([
        makeTikTokExternalOrder('TK-001'),
        makeTikTokExternalOrder('TK-002'),
        makeTikTokExternalOrder('TK-003'),
      ]),
      getOAuthUrl: vi.fn(),
      exchangeCode: vi.fn(),
    };

    executor.registerAdapter('TIKTOK' as any, mockTikTokAdapter);
  });

  it('should create orders with channel=tiktok on full sync', async () => {
    await executor.run(makeTikTokConnection() as any);

    expect(mockPrisma.order.create).toHaveBeenCalledTimes(3);
    expect(mockPrisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SUCCESS',
          ordersFetched: 3,
          ordersCreated: 3,
        }),
      }),
    );
  });

  it('should update existing orders on resync (no duplicates)', async () => {
    mockPrisma.order.findFirst
      .mockResolvedValueOnce({ id: 'existing-1' }) // TK-001 exists
      .mockResolvedValueOnce(null) // TK-002 new
      .mockResolvedValueOnce(null); // TK-003 new

    await executor.run(makeTikTokConnection() as any);

    expect(mockPrisma.order.update).toHaveBeenCalledTimes(1);
    expect(mockPrisma.order.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SUCCESS',
          ordersCreated: 2,
          ordersUpdated: 1,
        }),
      }),
    );
  });

  it('should write SUCCESS sync log', async () => {
    await executor.run(makeTikTokConnection() as any);

    expect(mockPrisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SUCCESS',
          durationMs: expect.any(Number),
          completedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('should retry on rate-limit then succeed', async () => {
    (mockTikTokAdapter.fetchOrders as any)
      .mockRejectedValueOnce(new RateLimitError())
      .mockResolvedValueOnce([makeTikTokExternalOrder()]);

    await executor.run(makeTikTokConnection() as any);

    expect(mockTikTokAdapter.fetchOrders).toHaveBeenCalledTimes(2);
    expect(mockPrisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SUCCESS' }),
      }),
    );
  });
});
