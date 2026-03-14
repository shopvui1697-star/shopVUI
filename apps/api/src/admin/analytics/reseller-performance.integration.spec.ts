import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@shopvui/db';
import { AdminAnalyticsService } from './admin-analytics.service';

describe('Reseller Performance Integration', () => {
  const service = new AdminAnalyticsService();
  const cleanupIds: {
    users: string[];
    resellers: string[];
    orders: string[];
    commissions: string[];
  } = { users: [], resellers: [], orders: [], commissions: [] };

  beforeAll(async () => {
    // Create two test users and resellers
    const user1 = await prisma.user.create({
      data: {
        email: `reseller-test-1-${Date.now()}@test.com`,
        name: 'Test Reseller 1',
        role: 'RESELLER',
      },
    });
    cleanupIds.users.push(user1.id);

    const user2 = await prisma.user.create({
      data: {
        email: `reseller-test-2-${Date.now()}@test.com`,
        name: 'Test Reseller 2',
        role: 'RESELLER',
      },
    });
    cleanupIds.users.push(user2.id);

    const reseller1 = await prisma.reseller.create({
      data: {
        userId: user1.id,
        name: 'Reseller One',
        email: user1.email,
        status: 'ACTIVE',
      },
    });
    cleanupIds.resellers.push(reseller1.id);

    const reseller2 = await prisma.reseller.create({
      data: {
        userId: user2.id,
        name: 'Reseller Two',
        email: user2.email,
        status: 'ACTIVE',
      },
    });
    cleanupIds.resellers.push(reseller2.id);

    // Create orders for reseller 1: 3 orders totaling 300000
    for (let i = 0; i < 3; i++) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `RP-TEST-R1-${Date.now()}-${i}`,
          channel: 'website',
          status: 'DELIVERED',
          paymentMethod: 'COD',
          subtotal: 100000,
          total: 100000,
          resellerId: reseller1.id,
        },
      });
      cleanupIds.orders.push(order.id);

      const commission = await prisma.commission.create({
        data: {
          orderId: order.id,
          resellerId: reseller1.id,
          couponCode: 'TEST-R1',
          orderTotal: 100000,
          commissionAmount: 10000,
          status: 'APPROVED',
        },
      });
      cleanupIds.commissions.push(commission.id);
    }

    // Create orders for reseller 2: 2 orders totaling 400000
    for (let i = 0; i < 2; i++) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `RP-TEST-R2-${Date.now()}-${i}`,
          channel: 'facebook',
          status: 'DELIVERED',
          paymentMethod: 'COD',
          subtotal: 200000,
          total: 200000,
          resellerId: reseller2.id,
        },
      });
      cleanupIds.orders.push(order.id);

      const commission = await prisma.commission.create({
        data: {
          orderId: order.id,
          resellerId: reseller2.id,
          couponCode: 'TEST-R2',
          orderTotal: 200000,
          commissionAmount: 20000,
          status: 'APPROVED',
        },
      });
      cleanupIds.commissions.push(commission.id);
    }
  });

  afterAll(async () => {
    await prisma.commission.deleteMany({
      where: { id: { in: cleanupIds.commissions } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: cleanupIds.orders } },
    });
    await prisma.reseller.deleteMany({
      where: { id: { in: cleanupIds.resellers } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: cleanupIds.users } },
    });
  });

  it('resellerMetricsMatchSeedData', async () => {
    const result = await service.resellerPerformance();

    const r1 = result.resellers.find((r) => r.resellerName === 'Reseller One');
    const r2 = result.resellers.find((r) => r.resellerName === 'Reseller Two');

    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    expect(r1!.orderCount).toBeGreaterThanOrEqual(3);
    expect(r2!.orderCount).toBeGreaterThanOrEqual(2);
    expect(r1!.revenue).toBeGreaterThanOrEqual(300000);
    expect(r2!.revenue).toBeGreaterThanOrEqual(400000);
  });

  it('avgCommissionRateIsWeightedAverage', async () => {
    const result = await service.resellerPerformance();

    // avgCommissionRate = totalCommissionPaid / totalResellerRevenue
    const recomputed =
      result.summary.totalResellerRevenue > 0
        ? Math.round(
            (result.summary.totalCommissionPaid /
              result.summary.totalResellerRevenue) *
              10000,
          ) / 10000
        : 0;
    expect(result.summary.avgCommissionRate).toBe(recomputed);
  });
});
