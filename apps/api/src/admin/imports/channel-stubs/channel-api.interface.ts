export interface IChannelApiAdapter {
  fetchOrders(params: { dateFrom: Date; dateTo: Date; page?: number }): Promise<{
    orders: ChannelOrder[];
    hasMore: boolean;
  }>;
  syncOrderStatus(externalOrderId: string): Promise<{ status: string }>;
}

export interface ChannelOrder {
  externalOrderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  total: number;
  subtotal: number;
  paymentMethod: string;
  status: string;
  items: {
    sku: string;
    quantity: number;
    unitPrice: number;
  }[];
}
