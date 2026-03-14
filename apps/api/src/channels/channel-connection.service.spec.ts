import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shopvui/db', () => {
  const mockPrisma = {
    channelConnection: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@shopvui/db';
import { ChannelConnectionService } from './channel-connection.service';

const mockPrisma = prisma as unknown as {
  channelConnection: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const mockEncryptionService = {
  encrypt: vi.fn((val: string) => `encrypted:${val}`),
  decrypt: vi.fn((val: string) => val.replace('encrypted:', '')),
};

const makeConnection = (overrides = {}) => ({
  id: 'conn-1',
  channel: 'SHOPEE',
  shopId: 'shop-123',
  shopName: 'My Shop',
  encryptedAccessToken: 'encrypted:access-token',
  encryptedRefreshToken: 'encrypted:refresh-token',
  tokenExpiresAt: new Date('2026-04-01'),
  syncEnabled: true,
  syncIntervalMinutes: 10,
  lastSyncAt: null,
  lastSyncStatus: 'IDLE',
  createdById: 'admin-1',
  createdAt: new Date('2026-03-12'),
  updatedAt: new Date('2026-03-12'),
  ...overrides,
});

describe('ChannelConnectionService', () => {
  let service: ChannelConnectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChannelConnectionService(mockEncryptionService as any);
  });

  it('should filter only enabled connections in findAllEnabled', async () => {
    const enabled = makeConnection({ syncEnabled: true });
    const disabled = makeConnection({ id: 'conn-2', syncEnabled: false });
    mockPrisma.channelConnection.findMany.mockResolvedValue([enabled]);

    const result = await service.findAllEnabled();

    expect(mockPrisma.channelConnection.findMany).toHaveBeenCalledWith({
      where: { syncEnabled: true },
    });
    expect(result).toHaveLength(1);
    expect(result[0].syncEnabled).toBe(true);
  });

  it('should encrypt tokens when creating a connection', async () => {
    const connection = makeConnection();
    mockPrisma.channelConnection.create.mockResolvedValue(connection);

    const result = await service.create({
      channel: 'SHOPEE' as any,
      shopId: 'shop-123',
      shopName: 'My Shop',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenExpiresAt: new Date('2026-04-01'),
      createdById: 'admin-1',
    });

    expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('access-token');
    expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('refresh-token');
    expect(mockPrisma.channelConnection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        encryptedAccessToken: 'encrypted:access-token',
        encryptedRefreshToken: 'encrypted:refresh-token',
      }),
    });
    // DTO should not contain token fields
    expect(result).not.toHaveProperty('encryptedAccessToken');
    expect(result).not.toHaveProperty('encryptedRefreshToken');
    expect(result).toHaveProperty('shopName', 'My Shop');
  });

  it('should update connection settings', async () => {
    const updated = makeConnection({ syncIntervalMinutes: 15 });
    mockPrisma.channelConnection.update.mockResolvedValue(updated);

    const result = await service.update('conn-1', { syncIntervalMinutes: 15 });

    expect(mockPrisma.channelConnection.update).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
      data: { syncIntervalMinutes: 15 },
    });
    expect(result.syncIntervalMinutes).toBe(15);
  });

  it('should delete a connection', async () => {
    mockPrisma.channelConnection.delete.mockResolvedValue(makeConnection());

    await service.delete('conn-1');

    expect(mockPrisma.channelConnection.delete).toHaveBeenCalledWith({
      where: { id: 'conn-1' },
    });
  });

  it('should never expose tokens in DTO', () => {
    const connection = makeConnection();
    const dto = service.toDto(connection as any);

    expect(dto).not.toHaveProperty('encryptedAccessToken');
    expect(dto).not.toHaveProperty('encryptedRefreshToken');
    expect(dto).not.toHaveProperty('tokenExpiresAt');
    expect(dto).toHaveProperty('id');
    expect(dto).toHaveProperty('channel');
    expect(dto).toHaveProperty('shopName');
  });

  it('should decrypt tokens', () => {
    const connection = makeConnection();
    const tokens = service.decryptTokens(connection as any);

    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).toBe('refresh-token');
  });
});
