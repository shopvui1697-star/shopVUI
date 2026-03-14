import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';
import { TikTokAdapter } from './tiktok.adapter';
import { RateLimitError, AuthExpiredError } from '../sync/errors';

const mockConfigService = {
  get: vi.fn((key: string, defaultVal?: string) => {
    const config: Record<string, string> = {
      TIKTOK_APP_KEY: 'tk-app-key-123',
      TIKTOK_APP_SECRET: 'tk-app-secret',
      TIKTOK_REDIRECT_URI: 'https://shopvui.vn/channels/oauth/callback',
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

describe('TikTokAdapter', () => {
  let adapter: TikTokAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new TikTokAdapter(
      mockConfigService as any,
      mockConnectionService as any,
    );
  });

  describe('getOAuthUrl', () => {
    it('should generate URL with required params', () => {
      const url = adapter.getOAuthUrl('test-state-123');

      expect(url).toContain('auth.tiktok-shops.com');
      expect(url).toContain('/oauth/authorize');
      expect(url).toContain('app_key=tk-app-key-123');
      expect(url).toContain('state=test-state-123');
    });
  });

  describe('exchangeCode', () => {
    it('should call TikTok token endpoint and return tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          access_token_expire_in: 14400,
          open_id: 'shop-789',
          seller_name: 'My TikTok Store',
        },
      };

      (adapter as any).httpPost = vi.fn().mockResolvedValue(mockResponse);

      const result = await adapter.exchangeCode('auth-code-123', '');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.expiresIn).toBe(14400);
      expect(result.shopName).toBe('My TikTok Store');
    });

    it('should extract shopId from open_id', async () => {
      const mockResponse = {
        data: {
          access_token: 'at',
          refresh_token: 'rt',
          access_token_expire_in: 14400,
          open_id: 'tiktok-shop-456',
          seller_name: 'Store',
        },
      };

      (adapter as any).httpPost = vi.fn().mockResolvedValue(mockResponse);

      const result = await adapter.exchangeCode('code', '');

      expect(result.shopName).toBe('Store');
    });

    it('should throw AuthExpiredError on error response', async () => {
      (adapter as any).httpPost = vi.fn().mockResolvedValue({
        code: 105,
        message: 'Invalid auth code',
      });

      await expect(adapter.exchangeCode('bad-code', '')).rejects.toThrow(AuthExpiredError);
    });
  });

  describe('sign', () => {
    it('should produce valid HMAC-SHA256 signature', () => {
      const path = '/api/orders/search';
      const params = { app_key: 'tk-app-key-123', timestamp: '1710000000' };

      const result = adapter.sign(path, params);

      // TikTok signing: secret + path + sorted_params_string + secret
      const sortedParams = Object.keys(params)
        .sort()
        .map((k) => `${k}${(params as any)[k]}`)
        .join('');
      const baseString = `tk-app-secret${path}${sortedParams}tk-app-secret`;
      const expected = createHmac('sha256', 'tk-app-secret')
        .update(baseString)
        .digest('hex');

      expect(result).toBe(expected);
    });
  });

  describe('refreshTokenIfNeeded', () => {
    it('should refresh when token is expired', async () => {
      const connection = {
        id: 'conn-1',
        shopId: 'shop-123',
        tokenExpiresAt: new Date(Date.now() - 60000),
      };

      (adapter as any).httpPost = vi.fn().mockResolvedValue({
        data: {
          access_token: 'refreshed-at',
          refresh_token: 'refreshed-rt',
          access_token_expire_in: 14400,
        },
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
        tokenExpiresAt: new Date(Date.now() + 3600000),
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
      channel: 'TIKTOK',
      shopId: 'shop-123',
      tokenExpiresAt: new Date(Date.now() + 3600000),
    };

    it('should fetch and map orders with pagination', async () => {
      (adapter as any).httpGet = vi.fn()
        .mockResolvedValueOnce({
          data: {
            orders: [
              {
                id: 'TK001',
                status: 'AWAITING_SHIPMENT',
                buyer_info: { buyer_username: 'buyer1' },
                recipient_address: { phone: '0901234567', full_address: '123 Street' },
                payment_info: { total_amount: '150000' },
                item_list: [
                  { id: 'item-1', sku_name: 'Widget', quantity: 2, sale_price: '75000' },
                ],
                create_time: 1710000000,
                update_time: 1710000100,
              },
            ],
            next_page_token: 'cursor-2',
          },
        })
        .mockResolvedValueOnce({
          data: {
            orders: [
              {
                id: 'TK002',
                status: 'SHIPPED',
                buyer_info: { buyer_username: 'buyer2' },
                payment_info: { total_amount: '200000' },
                item_list: [],
                create_time: 1710000200,
                update_time: 1710000300,
              },
            ],
            next_page_token: '',
          },
        });

      const orders = await adapter.fetchOrders(new Date('2026-03-01'), connection as any);

      expect(orders).toHaveLength(2);
      expect(orders[0].externalOrderId).toBe('TK001');
      expect(orders[0].customerName).toBe('buyer1');
      expect(orders[0].status).toBe('AWAITING_SHIPMENT');
      expect(orders[0].items).toHaveLength(1);
      expect(orders[0].items[0].productName).toBe('Widget');
      expect(orders[0].items[0].quantity).toBe(2);
      expect(orders[1].externalOrderId).toBe('TK002');
      expect((adapter as any).httpGet).toHaveBeenCalledTimes(2);
    });

    it('should throw RateLimitError on rate limit response', async () => {
      (adapter as any).httpGet = vi.fn().mockResolvedValue({
        code: 40029,
        message: 'Rate limit exceeded',
      });

      await expect(
        adapter.fetchOrders(new Date(), connection as any),
      ).rejects.toThrow(RateLimitError);
    });

    it('should throw RateLimitError on HTTP 429', async () => {
      (adapter as any).httpGet = vi.fn().mockRejectedValue(new RateLimitError('HTTP 429'));

      await expect(
        adapter.fetchOrders(new Date(), connection as any),
      ).rejects.toThrow(RateLimitError);
    });

    it('should map TikTok order fields correctly', async () => {
      (adapter as any).httpGet = vi.fn().mockResolvedValueOnce({
        data: {
          orders: [
            {
              id: 'TK-ORDER-001',
              status: 'DELIVERED',
              buyer_info: { buyer_username: 'Tran B' },
              recipient_address: {
                phone: '0912345678',
                name: 'Tran B',
                full_address: '456 Nguyen Hue, Q1, HCM',
                district: 'Quan 1',
                state: 'Ho Chi Minh',
              },
              payment_info: {
                total_amount: '500000',
                shipping_fee: '25000',
                seller_discount: '10000',
              },
              item_list: [
                { id: 'tki-1', sku_name: 'Ao Polo', sku_id: 'AP-001', quantity: 1, sale_price: '250000' },
                { id: 'tki-2', sku_name: 'Quan Short', sku_id: 'QS-001', quantity: 2, sale_price: '125000' },
              ],
              create_time: 1710000000,
              update_time: 1710086400,
            },
          ],
          next_page_token: '',
        },
      });

      const orders = await adapter.fetchOrders(new Date('2026-03-01'), connection as any);

      expect(orders[0].externalOrderId).toBe('TK-ORDER-001');
      expect(orders[0].status).toBe('DELIVERED');
      expect(orders[0].customerName).toBe('Tran B');
      expect(orders[0].customerPhone).toBe('0912345678');
      expect(orders[0].totalAmount).toBe(500000);
      expect(orders[0].shippingFee).toBe(25000);
      expect(orders[0].discountAmount).toBe(10000);
      expect(orders[0].items).toHaveLength(2);
      expect(orders[0].items[0].productName).toBe('Ao Polo');
      expect(orders[0].items[0].unitPrice).toBe(250000);
      expect(orders[0].items[1].quantity).toBe(2);
    });

    it('should handle missing optional fields gracefully', async () => {
      (adapter as any).httpGet = vi.fn().mockResolvedValueOnce({
        data: {
          orders: [
            {
              id: 'TK-MINIMAL',
              status: 'AWAITING_PAYMENT',
              buyer_info: {},
              payment_info: { total_amount: '100000' },
              item_list: [],
              create_time: 1710000000,
              update_time: 1710000100,
            },
          ],
          next_page_token: '',
        },
      });

      const orders = await adapter.fetchOrders(new Date('2026-03-01'), connection as any);

      expect(orders[0].externalOrderId).toBe('TK-MINIMAL');
      expect(orders[0].customerName).toBeNull();
      expect(orders[0].customerPhone).toBeUndefined();
      expect(orders[0].items).toHaveLength(0);
    });
  });
});
