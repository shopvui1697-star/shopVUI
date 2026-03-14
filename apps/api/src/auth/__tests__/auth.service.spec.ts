import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shopvui/db', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@shopvui/db';
import { AuthService } from '../auth.service';

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe('AuthService', () => {
  let authService: AuthService;
  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('mock-token'),
    verifyAsync: vi.fn().mockResolvedValue({ sub: 'user-1', email: 'test@example.com' }),
  };
  const mockConfigService = {
    get: vi.fn().mockReturnValue('test-secret'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockJwtService.signAsync.mockResolvedValue('mock-token');
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'test@example.com' });
    mockConfigService.get.mockReturnValue('test-secret');

    // Manually construct to avoid NestJS DI issues in vitest
    authService = new AuthService(mockJwtService as any, mockConfigService as any);
  });

  describe('findOrCreateUser', () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
    };

    it('should create a new user when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'google-123',
        avatar: 'https://example.com/avatar.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.findOrCreateUser(googleProfile);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          googleId: 'google-123',
          avatar: 'https://example.com/avatar.jpg',
        },
      });
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
      });
    });

    it('should update existing user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'old@example.com',
        name: 'Old Name',
        googleId: 'google-123',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'google-123',
        avatar: 'https://example.com/avatar.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.findOrCreateUser(googleProfile);

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const user = { id: 'user-1', email: 'test@example.com', name: 'Test', avatar: null };

      const result = await authService.generateTokens(user);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
      });
    });
  });

  describe('refreshTokens', () => {
    it('should verify refresh token and generate new tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        googleId: 'google-123',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'test-secret',
      });
      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.refreshTokens('valid-token')).rejects.toThrow('User not found');
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        googleId: 'google-123',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.getUserById('user-1');
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        avatar: null,
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await authService.getUserById('nonexistent');
      expect(result).toBeNull();
    });
  });
});
