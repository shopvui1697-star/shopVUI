import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';

const mockConfigService = {
  get: vi.fn().mockReturnValue('a'.repeat(64)),
};

describe('OAuthController & OAuthService', () => {
  let oauthService: OAuthService;
  let controller: OAuthController;
  const mockConnectionService = {
    create: vi.fn().mockResolvedValue({ id: 'conn-1' }),
  };
  const mockAdapter = {
    getOAuthUrl: vi.fn().mockReturnValue('https://shopee.com/oauth?state=xyz'),
    exchangeCode: vi.fn().mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 14400,
      shopName: 'My Shop',
    }),
    refreshTokenIfNeeded: vi.fn(),
    fetchOrders: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    oauthService = new OAuthService(mockConfigService as any);
    controller = new OAuthController(oauthService, mockConnectionService as any);
    controller.registerAdapter('SHOPEE', mockAdapter as any);
  });

  describe('OAuthService', () => {
    it('should generate and validate state round-trip', () => {
      const state = oauthService.generateState('admin-1', 'SHOPEE');
      const result = oauthService.validateState(state);
      expect(result.userId).toBe('admin-1');
      expect(result.channel).toBe('SHOPEE');
    });

    it('should reject invalid state', () => {
      expect(() => oauthService.validateState('bad-state')).toThrow(BadRequestException);
    });

    it('should reject reused state (one-time use)', () => {
      const state = oauthService.generateState('admin-1', 'SHOPEE');
      oauthService.validateState(state); // first use
      expect(() => oauthService.validateState(state)).toThrow(BadRequestException);
    });
  });

  describe('OAuthController', () => {
    it('should redirect to Shopee OAuth URL', async () => {
      const mockRes = { redirect: vi.fn() };
      const mockReq = { user: { id: 'admin-1' } };

      await controller.redirectToOAuth('shopee', mockReq as any, mockRes as any);

      expect(mockAdapter.getOAuthUrl).toHaveBeenCalled();
      expect(mockRes.redirect).toHaveBeenCalledWith(302, expect.stringContaining('shopee.com'));
    });

    it('should exchange code and redirect to admin on callback', async () => {
      const state = oauthService.generateState('admin-1', 'SHOPEE');
      const mockRes = { redirect: vi.fn() };

      await controller.handleCallback('auth-code', state, 'shop-123', mockRes as any);

      expect(mockAdapter.exchangeCode).toHaveBeenCalledWith('auth-code', 'shop-123');
      expect(mockConnectionService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'SHOPEE',
          shopId: 'shop-123',
          accessToken: 'at',
          refreshToken: 'rt',
        }),
      );
      expect(mockRes.redirect).toHaveBeenCalledWith('/admin/channels');
    });

    it('should reject callback with invalid state', async () => {
      const mockRes = { redirect: vi.fn() };

      await expect(
        controller.handleCallback('code', 'bad-state', 'shop-1', mockRes as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported channel', async () => {
      const mockRes = { redirect: vi.fn() };
      const mockReq = { user: { id: 'admin-1' } };

      await expect(
        controller.redirectToOAuth('facebook', mockReq as any, mockRes as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
