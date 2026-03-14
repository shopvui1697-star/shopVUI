import { Injectable, NotImplementedException } from '@nestjs/common';
import type { IChannelApiAdapter } from './channel-api.interface';

@Injectable()
export class ShopeeAdapter implements IChannelApiAdapter {
  fetchOrders(_params: { dateFrom: Date; dateTo: Date; page?: number }): Promise<any> {
    throw new NotImplementedException('Shopee API integration not yet implemented');
  }

  syncOrderStatus(_externalOrderId: string): Promise<any> {
    throw new NotImplementedException('Shopee API integration not yet implemented');
  }
}
