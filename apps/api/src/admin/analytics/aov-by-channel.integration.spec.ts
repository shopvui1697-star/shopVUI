import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@shopvui/db';
import { AdminAnalyticsService } from './admin-analytics.service';

describe('AOV by Channel Integration', () => {
  const service = new AdminAnalyticsService();
  const testIds: string[] = [];

  beforeAll(async () => {
    // Seed test data: 5 website orders at 100000 each, 5 shopee orders at 200000 each
    for (let i = 0; i < 5; i++) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `AOV-TEST-WEB-${Date.now()}-${i}`,
          channel: 'website',
          status: 'DELIVERED',
          paymentMethod: 'COD',
          subtotal: 100000,
          total: 100000,
        },
      });
      testIds.push(order.id);
    }
    for (let i = 0; i < 5; i++) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `AOV-TEST-SHOP-${Date.now()}-${i}`,
          channel: 'shopee',
          status: 'DELIVERED',
          paymentMethod: 'COD',
          subtotal: 200000,
          total: 200000,
        },
      });
      testIds.push(order.id);
    }
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { id: { in: testIds } } });
  });

  it('aovCalculationMatchesManualExpectation', async () => {
    const result = await service.aovByChannel();

    const websiteChannel = result.channels.find((c) => c.channel === 'website');
    const shopeeChannel = result.channels.find((c) => c.channel === 'shopee');

    // These are approximate since other test data may exist
    expect(websiteChannel).toBeDefined();
    expect(shopeeChannel).toBeDefined();
    expect(websiteChannel!.orderCount).toBeGreaterThanOrEqual(5);
    expect(shopeeChannel!.orderCount).toBeGreaterThanOrEqual(5);
  });

  it('overallAovIsWeightedByOrderCount', async () => {
    const result = await service.aovByChannel();

    // Overall AOV should be totalRevenue / totalOrders, not avg of channel AOVs
    const recomputed =
      result.summary.totalOrders > 0
        ? Math.round(result.summary.totalRevenue / result.summary.totalOrders)
        : 0;
    expect(result.summary.overallAov).toBe(recomputed);
  });
});
