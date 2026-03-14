import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@shopvui/db';

@Injectable()
export class AdminResellersService {
  async findAll(page = 1, pageSize = 20) {
    page = Math.max(1, page);
    pageSize = Math.min(Math.max(1, pageSize), 100);
    const skip = (page - 1) * pageSize;

    const [resellers, total] = await Promise.all([
      prisma.reseller.findMany({
        include: {
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.reseller.count(),
    ]);

    // Get revenue aggregation for each reseller
    const resellerIds = resellers.map((r) => r.id);
    const revenueData = await prisma.order.groupBy({
      by: ['resellerId'],
      where: { resellerId: { in: resellerIds }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    });

    const revenueMap = new Map(
      revenueData.map((r) => [r.resellerId, r._sum.total ?? 0]),
    );

    return {
      data: resellers.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        status: r.status,
        orderCount: r._count.orders,
        totalRevenue: revenueMap.get(r.id) ?? 0,
        commissionRate: r.defaultCommissionValue,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateStatus(id: string, status: string) {
    const reseller = await prisma.reseller.findUnique({ where: { id } });
    if (!reseller) throw new NotFoundException('Reseller not found');
    return prisma.reseller.update({ where: { id }, data: { status: status as any } });
  }

  async setCommissionRate(id: string, commissionType: string, commissionValue: number) {
    const reseller = await prisma.reseller.findUnique({ where: { id } });
    if (!reseller) throw new NotFoundException('Reseller not found');
    return prisma.reseller.update({
      where: { id },
      data: {
        defaultCommissionType: commissionType,
        defaultCommissionValue: commissionValue,
      },
    });
  }

  async findPayouts(filters: { status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(Math.max(1, filters.pageSize ?? 20), 100);
    const skip = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          reseller: { select: { name: true } },
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.commission.count({ where }),
    ]);

    return {
      data: commissions.map((c) => ({
        id: c.id,
        resellerId: c.resellerId,
        resellerName: c.reseller.name,
        commissionAmount: c.commissionAmount,
        status: c.status,
        orderId: c.orderId,
        orderNumber: c.order.orderNumber,
        couponCode: c.couponCode,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updatePayoutStatus(commissionId: string, status: 'APPROVED' | 'PAID') {
    const commission = await prisma.commission.findUnique({ where: { id: commissionId } });
    if (!commission) throw new NotFoundException('Commission not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { status };
    if (status === 'APPROVED') data.approvedAt = new Date();
    if (status === 'PAID') data.paidAt = new Date();

    return prisma.commission.update({ where: { id: commissionId }, data });
  }

  async exportPayoutsCsv(filters?: { status?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        reseller: { select: { name: true } },
        order: { select: { orderNumber: true, total: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const esc = (v: unknown) => {
      const s = String(v ?? '');
      const safe = s.replace(/^[=+\-@\t\r]/, "'$&");
      return safe.includes(',') || safe.includes('"') || safe.includes('\n')
        ? `"${safe.replace(/"/g, '""')}"`
        : safe;
    };

    const header = 'resellerName,orders,revenue,commissionOwed,payoutStatus';
    const rows = commissions.map(
      (c) =>
        [c.reseller.name, c.order.orderNumber, c.order.total, c.commissionAmount, c.status].map(esc).join(','),
    );
    return { csv: [header, ...rows].join('\n') };
  }
}
