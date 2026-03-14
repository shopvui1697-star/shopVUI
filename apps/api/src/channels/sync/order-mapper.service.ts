import { Injectable, Logger } from '@nestjs/common';
import type { OrderStatus, PaymentStatus, PaymentMethod } from '@shopvui/db';
import type { ExternalOrder } from '../adapters/channel-adapter.interface';

export interface MappedOrder {
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

@Injectable()
export class OrderMapperService {
  private readonly logger = new Logger(OrderMapperService.name);

  mapOrder(extOrder: ExternalOrder, channel: string): MappedOrder {
    const statusMapping = channel === 'SHOPEE'
      ? this.mapShopeeStatus(extOrder.status)
      : this.mapTikTokStatus(extOrder.status);

    const subtotal = extOrder.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    return {
      customerName: extOrder.customerName ?? null,
      customerPhone: extOrder.customerPhone ?? null,
      customerEmail: extOrder.customerEmail ?? null,
      status: statusMapping.status,
      paymentMethod: 'COD' as PaymentMethod,
      paymentStatus: statusMapping.paymentStatus ?? ('UNPAID' as PaymentStatus),
      subtotal,
      shippingFee: extOrder.shippingFee ?? 0,
      discountAmount: extOrder.discountAmount ?? 0,
      total: extOrder.totalAmount,
      items: extOrder.items.map((item) => ({
        productId: item.externalItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      })),
    };
  }

  mapShopeeStatus(raw: string): { status: OrderStatus; paymentStatus?: PaymentStatus } {
    switch (raw) {
      case 'UNPAID':
        return { status: 'PENDING' as OrderStatus, paymentStatus: 'UNPAID' as PaymentStatus };
      case 'READY_TO_SHIP':
        return { status: 'CONFIRMED' as OrderStatus };
      case 'SHIPPED':
        return { status: 'SHIPPING' as OrderStatus };
      case 'COMPLETED':
        return { status: 'DELIVERED' as OrderStatus };
      case 'CANCELLED':
        return { status: 'CANCELLED' as OrderStatus };
      default:
        this.logger.warn(`Unknown Shopee status: ${raw}, defaulting to PENDING`);
        return { status: 'PENDING' as OrderStatus };
    }
  }

  mapTikTokStatus(raw: string): { status: OrderStatus; paymentStatus?: PaymentStatus } {
    switch (raw) {
      case 'AWAITING_PAYMENT':
        return { status: 'PENDING' as OrderStatus };
      case 'AWAITING_SHIPMENT':
        return { status: 'CONFIRMED' as OrderStatus };
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return { status: 'SHIPPING' as OrderStatus };
      case 'DELIVERED':
        return { status: 'DELIVERED' as OrderStatus };
      case 'CANCELLED':
        return { status: 'CANCELLED' as OrderStatus };
      default:
        this.logger.warn(`Unknown TikTok status: ${raw}, defaulting to PENDING`);
        return { status: 'PENDING' as OrderStatus };
    }
  }
}
