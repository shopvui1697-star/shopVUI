import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import type { ChannelConnection } from '@shopvui/db';
import type { ChannelAdapter, ExternalOrder, ExternalOrderItem } from './channel-adapter.interface';
import { ChannelConnectionService } from '../channel-connection.service';
import { RateLimitError, AuthExpiredError, NetworkError } from '../sync/errors';

@Injectable()
export class TikTokAdapter implements ChannelAdapter {
  private readonly logger = new Logger(TikTokAdapter.name);
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;
  private readonly authBaseUrl = 'https://auth.tiktok-shops.com';
  private readonly apiBaseUrl = 'https://open-api.tiktokglobalshop.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly connectionService: ChannelConnectionService,
  ) {
    this.appKey = this.configService.get<string>('TIKTOK_APP_KEY', '');
    this.appSecret = this.configService.get<string>('TIKTOK_APP_SECRET', '');
    this.redirectUri = this.configService.get<string>('TIKTOK_REDIRECT_URI', '');
  }

  getOAuthUrl(state: string): string {
    const params = new URLSearchParams({
      app_key: this.appKey,
      state,
    });

    return `${this.authBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    _shopId: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    shopName: string;
  }> {
    const path = '/api/v2/token/get';
    const params = {
      app_key: this.appKey,
      app_secret: this.appSecret,
      auth_code: code,
      grant_type: 'authorized_code',
    };

    const url = `${this.apiBaseUrl}${path}`;
    const response = await this.httpPost(url, params);

    if (!response.data?.access_token) {
      throw new AuthExpiredError(`TikTok token exchange failed: ${response.message ?? 'Unknown error'}`);
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.access_token_expire_in,
      shopName: response.data.seller_name ?? `TikTok Shop ${response.data.open_id ?? ''}`.trim(),
    };
  }

  async refreshTokenIfNeeded(connection: ChannelConnection): Promise<ChannelConnection> {
    const bufferMs = 5 * 60 * 1000;
    if (connection.tokenExpiresAt.getTime() > Date.now() + bufferMs) {
      return connection;
    }

    this.logger.log(`Refreshing token for TikTok shop ${connection.shopId}`);

    const { refreshToken } = this.connectionService.decryptTokens(connection);
    const path = '/api/v2/token/refresh';

    const url = `${this.apiBaseUrl}${path}`;
    const response = await this.httpPost(url, {
      app_key: this.appKey,
      app_secret: this.appSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    if (!response.data?.access_token) {
      throw new AuthExpiredError(`TikTok token refresh failed: ${response.message ?? 'Unknown error'}`);
    }

    const newExpiresAt = new Date(Date.now() + response.data.access_token_expire_in * 1000);
    await this.connectionService.updateTokens(
      connection.id,
      response.data.access_token,
      response.data.refresh_token,
      newExpiresAt,
    );

    return {
      ...connection,
      tokenExpiresAt: newExpiresAt,
    };
  }

  async fetchOrders(since: Date, connection: ChannelConnection): Promise<ExternalOrder[]> {
    const { accessToken } = this.connectionService.decryptTokens(connection);
    const allOrders: ExternalOrder[] = [];
    let nextPageToken = '';

    do {
      const timestamp = Math.floor(Date.now() / 1000);
      const queryParams: Record<string, string> = {
        app_key: this.appKey,
        timestamp: timestamp.toString(),
        access_token: accessToken,
        shop_id: connection.shopId,
        create_time_from: Math.floor(since.getTime() / 1000).toString(),
        create_time_to: Math.floor(Date.now() / 1000).toString(),
        page_size: '50',
      };

      if (nextPageToken) {
        queryParams.page_token = nextPageToken;
      }

      const signValue = this.sign('/api/orders/search', queryParams);
      queryParams.sign = signValue;

      const params = new URLSearchParams(queryParams);
      const url = `${this.apiBaseUrl}/api/orders/search?${params.toString()}`;
      const response = await this.httpGet(url);

      if (response.code === 40029) {
        throw new RateLimitError(`TikTok rate limit: ${response.message ?? 'Too many requests'}`);
      }

      if (response.code && response.code !== 0) {
        if (response.code === 105 || response.code === 106) {
          throw new AuthExpiredError(`TikTok auth error: ${response.message}`);
        }
        throw new NetworkError(`TikTok API error: ${response.message}`);
      }

      const orders = response.data?.orders ?? [];
      for (const rawOrder of orders) {
        allOrders.push(this.mapRawOrder(rawOrder));
      }

      nextPageToken = response.data?.next_page_token ?? '';
    } while (nextPageToken);

    return allOrders;
  }

  private mapRawOrder(raw: any): ExternalOrder {
    return {
      externalOrderId: raw.id,
      status: raw.status,
      customerName: raw.buyer_info?.buyer_username ?? raw.recipient_address?.name ?? null,
      customerPhone: raw.recipient_address?.phone,
      shippingAddress: raw.recipient_address
        ? {
            street: raw.recipient_address.full_address,
            district: raw.recipient_address.district,
            province: raw.recipient_address.state,
          }
        : undefined,
      items: (raw.item_list ?? []).map((item: any): ExternalOrderItem => ({
        externalItemId: String(item.id),
        productName: item.sku_name,
        sku: item.sku_id,
        quantity: item.quantity,
        unitPrice: parseInt(item.sale_price ?? '0', 10),
      })),
      totalAmount: parseInt(raw.payment_info?.total_amount ?? '0', 10),
      shippingFee: parseInt(raw.payment_info?.shipping_fee ?? '0', 10),
      discountAmount: parseInt(raw.payment_info?.seller_discount ?? '0', 10),
      paymentMethod: raw.payment_info?.payment_method,
      createdAt: new Date((raw.create_time ?? 0) * 1000),
      updatedAt: new Date((raw.update_time ?? 0) * 1000),
    };
  }

  sign(path: string, params: Record<string, string>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join('');
    const baseString = `${this.appSecret}${path}${sortedParams}${this.appSecret}`;
    return createHmac('sha256', this.appSecret).update(baseString).digest('hex');
  }

  protected async httpGet(url: string): Promise<any> {
    const response = await fetch(url);
    if (response.status === 429) {
      throw new RateLimitError('TikTok HTTP 429');
    }
    return response.json();
  }

  protected async httpPost(url: string, body: any): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.status === 429) {
      throw new RateLimitError('TikTok HTTP 429');
    }
    return response.json();
  }
}
