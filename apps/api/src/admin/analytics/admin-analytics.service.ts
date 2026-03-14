import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { prisma } from '@shopvui/db';

@Injectable()
export class AdminAnalyticsService {
  async overview(dateFrom?: string, dateTo?: string) {
    const where = this.buildDateFilter(dateFrom, dateTo);

    const [totalRevenue, orderCount, customerCount, avgOrderValue] =
      await Promise.all([
        prisma.order.aggregate({
          where: { ...where, status: { not: 'CANCELLED' } },
          _sum: { total: true },
        }),
        prisma.order.count({ where }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.order.aggregate({
          where: { ...where, status: { not: 'CANCELLED' } },
          _avg: { total: true },
        }),
      ]);

    return {
      totalRevenue: totalRevenue._sum.total ?? 0,
      orderCount,
      customerCount,
      avgOrderValue: Math.round(avgOrderValue._avg.total ?? 0),
    };
  }

  async revenueByChannel(dateFrom?: string, dateTo?: string) {
    const where = this.buildDateFilter(dateFrom, dateTo);

    const result = await prisma.order.groupBy({
      by: ['channel'],
      where: { ...where, status: { not: 'CANCELLED' } },
      _sum: { total: true },
      _count: { id: true },
    });

    return result.map((r) => ({
      channel: r.channel,
      revenue: r._sum.total ?? 0,
      orderCount: r._count.id,
    }));
  }

  async revenueOverTime(
    dateFrom?: string,
    dateTo?: string,
    granularity: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    const ALLOWED_UNITS: Record<string, string> = {
      daily: 'day',
      weekly: 'week',
      monthly: 'month',
    };
    const truncUnit = ALLOWED_UNITS[granularity];
    if (!truncUnit) {
      throw new BadRequestException('Invalid granularity');
    }

    // SAFETY: truncUnit is validated against ALLOWED_UNITS whitelist above (line 58-60).
    // Only 'day', 'week', 'month' can reach this point. Prisma.raw is used because
    // SQL identifiers/keywords cannot be parameterized.
    const sql = Prisma.sql`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${truncUnit}'`)}, created_at) AS period,
        SUM(total) AS revenue,
        COUNT(id) AS order_count
      FROM "orders"
      WHERE status != 'CANCELLED'
      ${dateFrom ? Prisma.sql`AND created_at >= ${new Date(dateFrom)}::timestamp` : Prisma.empty}
      ${dateTo ? Prisma.sql`AND created_at <= ${new Date(dateTo)}::timestamp` : Prisma.empty}
      GROUP BY period
      ORDER BY period ASC
    `;

    const rows = await prisma.$queryRaw<
      Array<{ period: Date; revenue: bigint; order_count: bigint }>
    >(sql);

    return rows.map((r) => ({
      period: r.period.toISOString(),
      revenue: Number(r.revenue),
      orderCount: Number(r.order_count),
    }));
  }

  async topProducts(
    dateFrom?: string,
    dateTo?: string,
    limit: number = 10,
  ) {
    const dateFilter = this.buildDateFilter(dateFrom, dateTo);

    const items = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { ...dateFilter, status: { not: 'CANCELLED' } },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: limit,
    });

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return items.map((i) => ({
      productId: i.productId,
      productName: productMap.get(i.productId)?.name ?? 'Unknown',
      productSlug: productMap.get(i.productId)?.slug ?? null,
      totalQuantity: i._sum.quantity ?? 0,
      totalRevenue: i._sum.subtotal ?? 0,
    }));
  }

  async orderVolume(dateFrom?: string, dateTo?: string) {
    const where = this.buildDateFilter(dateFrom, dateTo);

    const result = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    return result.map((r) => ({
      status: r.status,
      count: r._count.id,
    }));
  }

  async aovByChannel(
    dateFrom?: string,
    dateTo?: string,
    granularity?: 'daily' | 'weekly' | 'monthly',
  ) {
    const where = this.buildDateFilter(dateFrom, dateTo);

    const channelData = await prisma.order.groupBy({
      by: ['channel'],
      where: { ...where, status: { not: 'CANCELLED' } },
      _avg: { total: true },
      _sum: { total: true },
      _count: { id: true },
    });

    const channels = channelData.map((r) => ({
      channel: r.channel,
      aov: Math.round(r._avg.total ?? 0),
      orderCount: r._count.id,
      revenue: r._sum.total ?? 0,
    }));

    const totalOrders = channels.reduce((sum, c) => sum + c.orderCount, 0);
    const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);
    const overallAov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const result: {
      summary: { overallAov: number; totalOrders: number; totalRevenue: number };
      channels: typeof channels;
      timeSeries?: Array<{ period: string; channel: string; aov: number }>;
    } = {
      summary: { overallAov, totalOrders, totalRevenue },
      channels,
    };

    if (granularity) {
      const ALLOWED_UNITS: Record<string, string> = {
        daily: 'day',
        weekly: 'week',
        monthly: 'month',
      };
      const truncUnit = ALLOWED_UNITS[granularity];
      if (!truncUnit) {
        throw new BadRequestException('Invalid granularity');
      }

      // SAFETY: truncUnit is validated against ALLOWED_UNITS whitelist above.
      const sql = Prisma.sql`
        SELECT
          DATE_TRUNC(${Prisma.raw(`'${truncUnit}'`)}, created_at) AS period,
          channel,
          AVG(total) AS aov,
          COUNT(id) AS order_count
        FROM "orders"
        WHERE status != 'CANCELLED'
        ${dateFrom ? Prisma.sql`AND created_at >= ${new Date(dateFrom)}::timestamp` : Prisma.empty}
        ${dateTo ? Prisma.sql`AND created_at <= ${new Date(dateTo)}::timestamp` : Prisma.empty}
        GROUP BY period, channel
        ORDER BY period ASC
      `;

      const rows = await prisma.$queryRaw<
        Array<{ period: Date; channel: string; aov: number; order_count: bigint }>
      >(sql);

      result.timeSeries = rows.map((r) => ({
        period: r.period.toISOString(),
        channel: r.channel,
        aov: Math.round(Number(r.aov)),
      }));
    }

    return result;
  }

  async resellerPerformance(dateFrom?: string, dateTo?: string) {
    const where = this.buildDateFilter(dateFrom, dateTo);

    const [ordersByReseller, commissionsByReseller, totalOrderCount] =
      await Promise.all([
        prisma.order.groupBy({
          by: ['resellerId'],
          where: {
            ...where,
            status: { not: 'CANCELLED' },
            resellerId: { not: null },
          },
          _sum: { total: true },
          _count: { id: true },
        }),
        prisma.commission.groupBy({
          by: ['resellerId'],
          where: where.createdAt ? { createdAt: where.createdAt } : {},
          _sum: { commissionAmount: true },
        }),
        prisma.order.count({
          where: { ...where, status: { not: 'CANCELLED' } },
        }),
      ]);

    const resellerIds = ordersByReseller
      .map((r) => r.resellerId)
      .filter((id): id is string => id !== null);

    const resellers =
      resellerIds.length > 0
        ? await prisma.reseller.findMany({
            where: { id: { in: resellerIds } },
            select: { id: true, name: true },
          })
        : [];

    const resellerMap = new Map(resellers.map((r) => [r.id, r.name]));
    const commissionMap = new Map(
      commissionsByReseller.map((c) => [
        c.resellerId,
        c._sum.commissionAmount ?? 0,
      ]),
    );

    const resellerRows = ordersByReseller
      .filter((r) => r.resellerId !== null)
      .map((r) => {
        const resellerId = r.resellerId!;
        const revenue = r._sum.total ?? 0;
        const commissionCost = commissionMap.get(resellerId) ?? 0;
        const orderCount = r._count.id;

        return {
          resellerId,
          resellerName: resellerMap.get(resellerId) ?? 'Unknown',
          revenue,
          commissionCost,
          orderCount,
          conversionRate:
            totalOrderCount > 0 ? orderCount / totalOrderCount : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const totalCommissionPaid = resellerRows.reduce(
      (sum, r) => sum + r.commissionCost,
      0,
    );
    const totalResellerRevenue = resellerRows.reduce(
      (sum, r) => sum + r.revenue,
      0,
    );
    const resellerOrderCount = resellerRows.reduce(
      (sum, r) => sum + r.orderCount,
      0,
    );
    const avgCommissionRate =
      totalResellerRevenue > 0
        ? totalCommissionPaid / totalResellerRevenue
        : 0;

    return {
      summary: {
        totalCommissionPaid,
        totalResellerRevenue,
        avgCommissionRate: Math.round(avgCommissionRate * 10000) / 10000,
        resellerOrderCount,
        totalOrderCount,
      },
      resellers: resellerRows,
    };
  }

  async couponPerformance(dateFrom?: string, dateTo?: string) {
    const dateFilter = this.buildDateFilter(dateFrom, dateTo);

    const coupons = await prisma.coupon.findMany({
      select: {
        id: true,
        code: true,
        _count: { select: { usages: true } },
      },
    });

    const results = await Promise.all(
      coupons.map(async (coupon) => {
        const usages = await prisma.couponUsage.findMany({
          where: { couponId: coupon.id },
          select: { orderId: true },
        });

        const orderIds = usages
          .map((u) => u.orderId)
          .filter((id): id is string => id !== null);

        let totalDiscountGiven = 0;
        let ordersInfluenced = 0;

        if (orderIds.length > 0) {
          const orderFilter: any = {
            id: { in: orderIds },
            ...dateFilter,
          };
          const agg = await prisma.order.aggregate({
            where: orderFilter,
            _sum: { discountAmount: true },
            _count: { id: true },
          });
          totalDiscountGiven = agg._sum.discountAmount ?? 0;
          ordersInfluenced = agg._count.id;
        }

        return {
          couponId: coupon.id,
          couponCode: coupon.code,
          usageCount: coupon._count.usages,
          totalDiscountGiven,
          ordersInfluenced,
        };
      }),
    );

    return results.filter((r) => r.usageCount > 0 || r.ordersInfluenced > 0);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildDateFilter(dateFrom?: string, dateTo?: string): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    return where;
  }
}
