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
import { RateLimitError, AuthExpiredError, NetworkError, MappingError } from './errors';
import type { ExternalOrder } from '../adapters/channel-adapter.interface';

const mockPrisma = prisma as any;

const makeConnection = (overrides = {}) => ({
  id: 'conn-1',
  channel: 'SHOPEE',
  shopId: 'shop-123',
  shopName: 'My Shop',
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

const makeExternalOrder = (id = 'ext-1'): ExternalOrder => ({
  externalOrderId: id,
  status: 'READY_TO_SHIP',
  customerName: 'Test Customer',
  customerPhone: '0901234567',
  items: [
    { externalItemId: 'item-1', productName: 'Widget', quantity: 2, unitPrice: 50000 },
  ],
  totalAmount: 100000,
  shippingFee: 15000,
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
    customerName: 'Test Customer',
    customerPhone: '0901234567',
    customerEmail: null,
    status: 'CONFIRMED',
    paymentMethod: 'COD',
    paymentStatus: 'UNPAID',
    subtotal: 100000,
    shippingFee: 15000,
    discountAmount: 0,
    total: 100000,
    items: [{ productId: 'item-1', quantity: 2, unitPrice: 50000, subtotal: 100000 }],
  }),
};

describe('SyncExecutorService', () => {
  let executor: SyncExecutorService;
  let mockAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.syncLog.create.mockResolvedValue({ id: 'log-1' });
    mockPrisma.syncLog.update.mockResolvedValue({});
    mockPrisma.channelConnection.update.mockResolvedValue({});
    mockPrisma.order.findFirst.mockResolvedValue(null);
    mockPrisma.order.create.mockResolvedValue({ id: 'order-1' });

    executor = new SyncExecutorService(
      mockConnectionService as any,
      mockOrderMapper as any,
    );

    // Mock sleep to avoid real delays in tests
    (executor as any).sleep = vi.fn().mockResolvedValue(undefined);

    mockAdapter = {
      refreshTokenIfNeeded: vi.fn().mockImplementation((c: any) => Promise.resolve(c)),
      fetchOrders: vi.fn().mockResolvedValue([makeExternalOrder()]),
      getOAuthUrl: vi.fn(),
      exchangeCode: vi.fn(),
    };

    executor.registerAdapter('SHOPEE' as any, mockAdapter);
  });

  it('should write SUCCESS sync log on successful sync', async () => {
    mockAdapter.fetchOrders.mockResolvedValue([
      makeExternalOrder('ext-1'),
      makeExternalOrder('ext-2'),
      makeExternalOrder('ext-3'),
    ]);

    await executor.run(makeConnection() as any);

    expect(mockPrisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SUCCESS',
          ordersCreated: 3,
          ordersFetched: 3,
        }),
      }),
    );
  });

  it('should retry on RateLimitError then succeed', async () => {
    mockAdapter.fetchOrders
      .mockRejectedValueOnce(new RateLimitError())
      .mockRejectedValueOnce(new RateLimitError())
      .mockResolvedValueOnce([makeExternalOrder()]);

    await executor.run(makeConnection() as any);

    expect(mockAdapter.fetchOrders).toHaveBeenCalledTimes(3);
    expect(mockPrisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SUCCESS' }),
      }),
    );
  });

  it('should write FAILED sync log after max retries', async () => {
    mockAdapter.fetchOrders.mockRejectedValue(new RateLimitError());

    await executor.run(makeConnection() as any);

    expect(mockAdapter.fetchOrders).toHaveBeenCalledTimes(3);
    expect(mockPrisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          errorType: 'rate_limit',
        }),
      }),
    );
  });

  it('should update lastSyncAt on success', async () => {
    await executor.run(makeConnection() as any);

    expect(mockPrisma.channelConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastSyncAt: expect.any(Date),
          lastSyncStatus: 'SUCCESS',
        }),
      }),
    );
  });

  it('should record auth_expired error type', async () => {
    mockAdapter.refreshTokenIfNeeded.mockRejectedValue(new AuthExpiredError());

    await executor.run(makeConnection() as any);

    expect(mockPrisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          errorType: 'auth_expired',
        }),
      }),
    );
  });

  it('should record mapping_error error type', async () => {
    mockOrderMapper.mapOrder.mockImplementation(() => {
      throw new MappingError('Invalid field');
    });

    await executor.run(makeConnection() as any);

    expect(mockPrisma.syncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          errorType: 'mapping_error',
        }),
      }),
    );
  });

  it('should store human-readable error messages, not stack traces', async () => {
    mockAdapter.fetchOrders.mockRejectedValue(new NetworkError());

    await executor.run(makeConnection() as any);

    const updateCall = mockPrisma.syncLog.update.mock.calls.find(
      (c: any) => c[0].data.status === 'FAILED',
    );
    expect(updateCall[0].data.errorMessage).toBeTruthy();
    expect(updateCall[0].data.errorMessage).not.toContain('at ');
    expect(typeof updateCall[0].data.errorMessage).toBe('string');
  });
});
