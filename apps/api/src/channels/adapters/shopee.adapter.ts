import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import type { ChannelConnection } from '@shopvui/db';
import type { ChannelAdapter, ExternalOrder, ExternalOrderItem } from './channel-adapter.interface';
import { ChannelConnectionService } from '../channel-connection.service';
import { RateLimitError, AuthExpiredError, NetworkError } from '../sync/errors';

@Injectable()
export class ShopeeAdapter implements ChannelAdapter {
  private readonly logger = new Logger(ShopeeAdapter.name);
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;
  private readonly baseUrl = 'https://partner.shopeemobile.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly connectionService: ChannelConnectionService,
  ) {
    this.appKey = this.configService.get<string>('SHOPEE_APP_KEY', '');
    this.appSecret = this.configService.get<string>('SHOPEE_APP_SECRET', '');
    this.redirectUri = this.configService.get<string>('SHOPEE_REDIRECT_URI', '');
  }

  getOAuthUrl(state: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const sign = this.sign(path, timestamp);

    const params = new URLSearchParams({
      app_key: this.appKey,
      redirect: this.redirectUri,
      sign,
      timestamp: timestamp.toString(),
      state,
    });

    return `${this.baseUrl}${path}?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    shopId: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    shopName: string;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/token/get';
    const sign = this.sign(path, timestamp);

    const url = `${this.baseUrl}${path}?app_key=${this.appKey}&sign=${sign}&timestamp=${timestamp}`;
    const response = await this.httpPost(url, {
      code,
      shop_id: parseInt(shopId, 10),
      partner_id: parseInt(this.appKey, 10),
    });

    if (response.error) {
      throw new AuthExpiredError(`Shopee token exchange failed: ${response.message}`);
    }

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expire_in,
      shopName: response.shop_name ?? `Shopee Shop ${shopId}`,
    };
  }

  async refreshTokenIfNeeded(connection: ChannelConnection): Promise<ChannelConnection> {
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    if (connection.tokenExpiresAt.getTime() > Date.now() + bufferMs) {
      return connection;
    }

    this.logger.log(`Refreshing token for Shopee shop ${connection.shopId}`);

    const { refreshToken } = this.connectionService.decryptTokens(connection);
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/access_token/get';
    const sign = this.sign(path, timestamp);

    const url = `${this.baseUrl}${path}?app_key=${this.appKey}&sign=${sign}&timestamp=${timestamp}`;
    const response = await this.httpPost(url, {
      refresh_token: refreshToken,
      shop_id: parseInt(connection.shopId, 10),
      partner_id: parseInt(this.appKey, 10),
    });

    if (response.error) {
      throw new AuthExpiredError(`Shopee token refresh failed: ${response.message}`);
    }

    const newExpiresAt = new Date(Date.now() + response.expire_in * 1000);
    await this.connectionService.updateTokens(
      connection.id,
      response.access_token,
      response.refresh_token,
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
    let cursor = '';
    let hasMore = true;

    while (hasMore) {
      const timestamp = Math.floor(Date.now() / 1000);
      const path = '/api/v2/order/get_order_list';
      const sign = this.signWithToken(path, timestamp, accessToken, connection.shopId);

      const params = new URLSearchParams({
        app_key: this.appKey,
        sign,
        timestamp: timestamp.toString(),
        access_token: accessToken,
        shop_id: connection.shopId,
        time_range_field: 'update_time',
        time_from: Math.floor(since.getTime() / 1000).toString(),
        time_to: Math.floor(Date.now() / 1000).toString(),
        page_size: '50',
      });

      if (cursor) {
        params.set('cursor', cursor);
      }

      const url = `${this.baseUrl}${path}?${params.toString()}`;
      const response = await this.httpGet(url);

      if (response.error && (response.error === 'error_auth' || response.error === 'error_permission')) {
        throw new AuthExpiredError(`Shopee auth error: ${response.message}`);
      }

      if (this.isRateLimited(response)) {
        throw new RateLimitError(`Shopee rate limit: ${response.message ?? 'Too many requests'}`);
      }

      if (response.error) {
        throw new NetworkError(`Shopee API error: ${response.message}`);
      }

      const orderList = response.response?.order_list ?? [];
      for (const rawOrder of orderList) {
        allOrders.push(this.mapRawOrder(rawOrder));
      }

      hasMore = response.response?.more ?? false;
      cursor = response.response?.next_cursor ?? '';
    }

    return allOrders;
  }

  private mapRawOrder(raw: any): ExternalOrder {
    return {
      externalOrderId: raw.order_sn,
      status: raw.order_status,
      customerName: raw.buyer_username ?? raw.recipient_address?.name ?? null,
      customerPhone: raw.recipient_address?.phone ?? null,
      shippingAddress: raw.recipient_address
        ? {
            street: raw.recipient_address.full_address,
            district: raw.recipient_address.district,
            province: raw.recipient_address.state,
          }
        : undefined,
      items: (raw.item_list ?? []).map((item: any): ExternalOrderItem => ({
        externalItemId: String(item.item_id),
        productName: item.item_name,
        sku: item.item_sku,
        quantity: item.model_quantity_purchased ?? item.quantity,
        unitPrice: Math.round((item.model_discounted_price ?? item.item_price ?? 0) * 100),
      })),
      totalAmount: Math.round((raw.total_amount ?? 0) * 100),
      shippingFee: Math.round((raw.estimated_shipping_fee ?? 0) * 100),
      discountAmount: Math.round(Math.abs(raw.voucher_absorbed_by_seller ?? 0) * 100),
      paymentMethod: raw.payment_method,
      createdAt: new Date((raw.create_time ?? 0) * 1000),
      updatedAt: new Date((raw.update_time ?? 0) * 1000),
    };
  }

  sign(path: string, timestamp: number): string {
    const baseString = `${this.appKey}${path}${timestamp}`;
    return createHmac('sha256', this.appSecret).update(baseString).digest('hex');
  }

  private signWithToken(path: string, timestamp: number, accessToken: string, shopId: string): string {
    const baseString = `${this.appKey}${path}${timestamp}${accessToken}${shopId}`;
    return createHmac('sha256', this.appSecret).update(baseString).digest('hex');
  }

  private isRateLimited(response: any): boolean {
    return response.error === 'error_too_many_request';
  }

  protected async httpGet(url: string): Promise<any> {
    const response = await fetch(url);
    if (response.status === 429) {
      throw new RateLimitError('Shopee HTTP 429');
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
      throw new RateLimitError('Shopee HTTP 429');
    }
    return response.json();
  }
}
