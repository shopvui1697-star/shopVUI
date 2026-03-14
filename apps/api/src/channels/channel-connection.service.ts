import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import type { ChannelConnection, ChannelType } from '@shopvui/db';
import { CredentialEncryptionService } from './encryption/credential-encryption.service';

export interface ChannelConnectionDto {
  id: string;
  channel: ChannelType;
  shopId: string;
  shopName: string;
  syncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  createdAt: string;
}

export interface CreateChannelConnectionDto {
  channel: ChannelType;
  shopId: string;
  shopName: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  createdById: string;
}

@Injectable()
export class ChannelConnectionService {
  private readonly logger = new Logger(ChannelConnectionService.name);

  constructor(private readonly encryptionService: CredentialEncryptionService) {}

  async create(dto: CreateChannelConnectionDto): Promise<ChannelConnectionDto> {
    const connection = await prisma.channelConnection.create({
      data: {
        channel: dto.channel,
        shopId: dto.shopId,
        shopName: dto.shopName,
        encryptedAccessToken: this.encryptionService.encrypt(dto.accessToken),
        encryptedRefreshToken: this.encryptionService.encrypt(dto.refreshToken),
        tokenExpiresAt: dto.tokenExpiresAt,
        createdById: dto.createdById,
      },
    });

    return this.toDto(connection);
  }

  async findAll(): Promise<ChannelConnectionDto[]> {
    const connections = await prisma.channelConnection.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return connections.map((c) => this.toDto(c));
  }

  async findAllEnabled(): Promise<ChannelConnection[]> {
    return prisma.channelConnection.findMany({
      where: { syncEnabled: true },
    });
  }

  async findById(id: string): Promise<ChannelConnection> {
    const connection = await prisma.channelConnection.findUnique({ where: { id } });
    if (!connection) throw new NotFoundException('Channel connection not found');
    return connection;
  }

  async update(
    id: string,
    data: Partial<Pick<ChannelConnection, 'syncEnabled' | 'syncIntervalMinutes' | 'lastSyncAt' | 'lastSyncStatus' | 'encryptedAccessToken' | 'encryptedRefreshToken' | 'tokenExpiresAt'>>,
  ): Promise<ChannelConnectionDto> {
    const connection = await prisma.channelConnection.update({
      where: { id },
      data,
    });
    return this.toDto(connection);
  }

  async delete(id: string): Promise<void> {
    await prisma.channelConnection.delete({ where: { id } });
  }

  toDto(connection: ChannelConnection): ChannelConnectionDto {
    return {
      id: connection.id,
      channel: connection.channel,
      shopId: connection.shopId,
      shopName: connection.shopName,
      syncEnabled: connection.syncEnabled,
      syncIntervalMinutes: connection.syncIntervalMinutes,
      lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
      lastSyncStatus: connection.lastSyncStatus,
      createdAt: connection.createdAt.toISOString(),
    };
  }

  decryptTokens(connection: ChannelConnection): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.encryptionService.decrypt(connection.encryptedAccessToken),
      refreshToken: this.encryptionService.decrypt(connection.encryptedRefreshToken),
    };
  }

  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken: string,
    tokenExpiresAt: Date,
  ): Promise<void> {
    await prisma.channelConnection.update({
      where: { id },
      data: {
        encryptedAccessToken: this.encryptionService.encrypt(accessToken),
        encryptedRefreshToken: this.encryptionService.encrypt(refreshToken),
        tokenExpiresAt,
      },
    });
  }
}
