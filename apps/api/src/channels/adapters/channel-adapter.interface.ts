import type { ChannelConnection } from '@shopvui/db';

export interface ChannelAdapter {
  getOAuthUrl(state: string): string;
  exchangeCode(code: string, shopId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    shopName: string;
  }>;
  refreshTokenIfNeeded(connection: ChannelConnection): Promise<ChannelConnection>;
  fetchOrders(since: Date, connection: ChannelConnection): Promise<ExternalOrder[]>;
}

export interface ExternalOrder {
  externalOrderId: string;
  status: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: {
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
  };
  items: ExternalOrderItem[];
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalOrderItem {
  externalItemId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}
