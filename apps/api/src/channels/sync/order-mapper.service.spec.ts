import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderMapperService } from './order-mapper.service';
import type { ExternalOrder } from '../adapters/channel-adapter.interface';

const makeShopeeOrder = (overrides = {}): ExternalOrder => ({
  externalOrderId: 'SH-12345',
  status: 'READY_TO_SHIP',
  customerName: 'Nguyen Van A',
  customerPhone: '0901234567',
  customerEmail: 'a@example.com',
  items: [
    { externalItemId: 'item-1', productName: 'Ao Thun', sku: 'AT-001', quantity: 2, unitPrice: 150000 },
    { externalItemId: 'item-2', productName: 'Quan Jeans', sku: 'QJ-001', quantity: 1, unitPrice: 350000 },
  ],
  totalAmount: 650000,
  shippingFee: 30000,
  discountAmount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('OrderMapperService', () => {
  let mapper: OrderMapperService;

  beforeEach(() => {
    mapper = new OrderMapperService();
  });

  describe('mapOrder (Shopee)', () => {
    it('should map basic fields correctly', () => {
      const result = mapper.mapOrder(makeShopeeOrder(), 'SHOPEE');

      expect(result.customerName).toBe('Nguyen Van A');
      expect(result.customerPhone).toBe('0901234567');
      expect(result.total).toBe(650000);
      expect(result.paymentMethod).toBe('COD');
    });

    it('should map line items', () => {
      const result = mapper.mapOrder(makeShopeeOrder(), 'SHOPEE');

      expect(result.items).toHaveLength(2);
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].unitPrice).toBe(150000);
      expect(result.items[0].subtotal).toBe(300000);
    });

    it('should produce consistent channelOrderId for dedup', () => {
      const order = makeShopeeOrder();
      const result1 = mapper.mapOrder(order, 'SHOPEE');
      const result2 = mapper.mapOrder(order, 'SHOPEE');

      expect(result1).toEqual(result2);
    });

    it('should handle missing optional fields gracefully', () => {
      const order = makeShopeeOrder({
        customerPhone: undefined,
        customerEmail: undefined,
        shippingAddress: undefined,
      });

      const result = mapper.mapOrder(order, 'SHOPEE');

      expect(result.customerPhone).toBeNull();
      expect(result.customerEmail).toBeNull();
    });
  });

  describe('mapShopeeStatus', () => {
    it('should map UNPAID to PENDING with UNPAID payment', () => {
      const result = mapper.mapShopeeStatus('UNPAID');
      expect(result).toEqual({ status: 'PENDING', paymentStatus: 'UNPAID' });
    });

    it('should map READY_TO_SHIP to CONFIRMED', () => {
      expect(mapper.mapShopeeStatus('READY_TO_SHIP')).toEqual({ status: 'CONFIRMED' });
    });

    it('should map SHIPPED to SHIPPING', () => {
      expect(mapper.mapShopeeStatus('SHIPPED')).toEqual({ status: 'SHIPPING' });
    });

    it('should map COMPLETED to DELIVERED', () => {
      expect(mapper.mapShopeeStatus('COMPLETED')).toEqual({ status: 'DELIVERED' });
    });

    it('should map CANCELLED to CANCELLED', () => {
      expect(mapper.mapShopeeStatus('CANCELLED')).toEqual({ status: 'CANCELLED' });
    });

    it('should default unknown status to PENDING with warning', () => {
      const warnSpy = vi.spyOn((mapper as any).logger, 'warn').mockImplementation(() => {});
      const result = mapper.mapShopeeStatus('UNKNOWN_XYZ');
      expect(result).toEqual({ status: 'PENDING' });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('UNKNOWN_XYZ'));
    });
  });

  describe('mapTikTokStatus', () => {
    it('should map AWAITING_PAYMENT to PENDING', () => {
      expect(mapper.mapTikTokStatus('AWAITING_PAYMENT')).toEqual({ status: 'PENDING' });
    });

    it('should map AWAITING_SHIPMENT to CONFIRMED', () => {
      expect(mapper.mapTikTokStatus('AWAITING_SHIPMENT')).toEqual({ status: 'CONFIRMED' });
    });

    it('should map SHIPPED to SHIPPING', () => {
      expect(mapper.mapTikTokStatus('SHIPPED')).toEqual({ status: 'SHIPPING' });
    });

    it('should map IN_TRANSIT to SHIPPING', () => {
      expect(mapper.mapTikTokStatus('IN_TRANSIT')).toEqual({ status: 'SHIPPING' });
    });

    it('should map DELIVERED to DELIVERED', () => {
      expect(mapper.mapTikTokStatus('DELIVERED')).toEqual({ status: 'DELIVERED' });
    });

    it('should map CANCELLED to CANCELLED', () => {
      expect(mapper.mapTikTokStatus('CANCELLED')).toEqual({ status: 'CANCELLED' });
    });

    it('should default unknown status to PENDING with warning', () => {
      const warnSpy = vi.spyOn((mapper as any).logger, 'warn').mockImplementation(() => {});
      const result = mapper.mapTikTokStatus('UNKNOWN_XYZ');
      expect(result).toEqual({ status: 'PENDING' });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('UNKNOWN_XYZ'));
    });
  });
});
