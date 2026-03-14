import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';
import { ShopeeAdapter } from './shopee.adapter';
import { RateLimitError, AuthExpiredError } from '../sync/errors';

const mockConfigService = {
  get: vi.fn((key: string, defaultVal?: string) => {
    const config: Record<string, string> = {
      SHOPEE_APP_KEY: '123456',
      SHOPEE_APP_SECRET: 'test-secret-key',
      SHOPEE_REDIRECT_URI: 'https://shopvui.vn/channels/oauth/callback',
    };
    return config[key] ?? defaultVal;
  }),
};

const mockConnectionService = {
  decryptTokens: vi.fn().mockReturnValue({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  }),
  update: vi.fn().mockResolvedValue({}),
  updateTokens: vi.fn().mockResolvedValue(undefined),
};

describe('ShopeeAdapter', () => {
  let adapter: ShopeeAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new ShopeeAdapter(
      mockConfigService as any,
      mockConnectionService as any,
    );
  });

  describe('getOAuthUrl', () => {
    it('should generate URL with required params', () => {
      const url = adapter.getOAuthUrl('test-state-123');

      expect(url).toContain('partner.shopeemobile.com');
      expect(url).toContain('/api/v2/shop/auth_partner');
      expect(url).toContain('app_key=123456');
      expect(url).toContain('state=test-state-123');
      expect(url).toContain('redirect=');
      expect(url).toContain('sign=');
      expect(url).toContain('timestamp=');
    });
  });

  describe('exchangeCode', () => {
    it('should call Shopee token endpoint and return tokens', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expire_in: 14400,
        shop_name: 'My Shopee Store',
      };

      (adapter as any).httpPost = vi.fn().mockResolvedValue(mockResponse);

      const result = await adapter.exchangeCode('auth-code-123', 'shop-456');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.expiresIn).toBe(14400);
      expect(result.shopName).toBe('My Shopee Store');
    });

    it('should throw AuthExpiredError on Shopee error response', async () => {
      (adapter as any).httpPost = vi.fn().mockResolvedValue({
        error: 'error_auth',
        message: 'Invalid code',
      });

      await expect(adapter.exchangeCode('bad-code', 'shop-1')).rejects.toThrow(AuthExpiredError);
    });
  });

  describe('sign', () => {
    it('should produce valid HMAC-SHA256 signature', () => {
      const path = '/api/v2/shop/auth_partner';
      const timestamp = 1710000000;

      const result = adapter.sign(path, timestamp);

      const expected = createHmac('sha256', 'test-secret-key')
        .update(`123456${path}${timestamp}`)
        .digest('hex');

      expect(result).toBe(expected);
    });
  });

  describe('refreshTokenIfNeeded', () => {
    it('should refresh when token is expired', async () => {
      const connection = {
        id: 'conn-1',
        shopId: 'shop-123',
        tokenExpiresAt: new Date(Date.now() - 60000), // expired
      };

      (adapter as any).httpPost = vi.fn().mockResolvedValue({
        access_token: 'refreshed-at',
        refresh_token: 'refreshed-rt',
        expire_in: 14400,
      });

      const result = await adapter.refreshTokenIfNeeded(connection as any);

      expect((adapter as any).httpPost).toHaveBeenCalled();
      expect(mockConnectionService.updateTokens).toHaveBeenCalledWith(
        'conn-1',
        'refreshed-at',
        'refreshed-rt',
        expect.any(Date),
      );
      expect(result.tokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should skip refresh when token is still valid', async () => {
      const connection = {
        id: 'conn-1',
        shopId: 'shop-123',
        tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      (adapter as any).httpPost = vi.fn();

      const result = await adapter.refreshTokenIfNeeded(connection as any);

      expect((adapter as any).httpPost).not.toHaveBeenCalled();
      expect(result).toBe(connection);
    });
  });

  describe('fetchOrders', () => {
    const connection = {
      id: 'conn-1',
      channel: 'SHOPEE',
      shopId: 'shop-123',
      tokenExpiresAt: new Date(Date.now() + 3600000),
    };

    it('should fetch and map orders with pagination', async () => {
      (adapter as any).httpGet = vi.fn()
        .mockResolvedValueOnce({
          response: {
            order_list: [
              {
                order_sn: 'SH001',
                order_status: 'READY_TO_SHIP',
                buyer_username: 'buyer1',
                total_amount: 100.50,
                estimated_shipping_fee: 15,
                item_list: [
                  { item_id: 1, item_name: 'Widget', quantity: 2, item_price: 50.25 },
                ],
              },
            ],
            more: true,
            next_cursor: 'cursor-2',
          },
        })
        .mockResolvedValueOnce({
          response: {
            order_list: [
              {
                order_sn: 'SH002',
                order_status: 'SHIPPED',
                buyer_username: 'buyer2',
                total_amount: 200,
                estimated_shipping_fee: 20,
                item_list: [],
              },
            ],
            more: false,
            next_cursor: '',
          },
        });

      const orders = await adapter.fetchOrders(new Date('2026-03-01'), connection as any);

      expect(orders).toHaveLength(2);
      expect(orders[0].externalOrderId).toBe('SH001');
      expect(orders[0].customerName).toBe('buyer1');
      expect(orders[1].externalOrderId).toBe('SH002');
      expect((adapter as any).httpGet).toHaveBeenCalledTimes(2);
    });

    it('should throw RateLimitError on 429', async () => {
      (adapter as any).httpGet = vi.fn().mockRejectedValue(new RateLimitError('HTTP 429'));

      await expect(
        adapter.fetchOrders(new Date(), connection as any),
      ).rejects.toThrow(RateLimitError);
    });
  });
});
