import { Injectable, NotImplementedException } from '@nestjs/common';
import type { IChannelApiAdapter } from './channel-api.interface';

@Injectable()
export class TikTokAdapter implements IChannelApiAdapter {
  fetchOrders(_params: { dateFrom: Date; dateTo: Date; page?: number }): Promise<any> {
    throw new NotImplementedException('TikTok Shop API integration not yet implemented');
  }

  syncOrderStatus(_externalOrderId: string): Promise<any> {
    throw new NotImplementedException('TikTok Shop API integration not yet implemented');
  }
}
