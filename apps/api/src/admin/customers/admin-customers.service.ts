import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@shopvui/db';

@Injectable()
export class AdminCustomersService {
  async findAll(filters: {
    search?: string;
    minSpend?: number;
    maxSpend?: number;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(Math.max(1, filters.pageSize ?? 20), 100);
    const skip = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { role: 'CUSTOMER' };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // If spend filters are provided, we need to load all and filter in-memory
    const needsSpendFilter = filters.minSpend !== undefined || filters.maxSpend !== undefined;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        ...(needsSpendFilter ? {} : { skip, take: pageSize }),
      }),
      prisma.user.count({ where }),
    ]);

    // Aggregate order stats for these users in a single query
    const userIds = users.map((u) => u.id);
    const orderStats = await prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
      _count: { id: true },
      _max: { createdAt: true },
    });

    const statsMap = new Map(
      orderStats.map((s) => [
        s.userId,
        {
          orderCount: s._count.id,
          totalSpend: s._sum.total ?? 0,
          lastOrderDate: s._max.createdAt?.toISOString() ?? null,
        },
      ]),
    );

    let data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      orderCount: statsMap.get(u.id)?.orderCount ?? 0,
      totalSpend: statsMap.get(u.id)?.totalSpend ?? 0,
      lastOrderDate: statsMap.get(u.id)?.lastOrderDate ?? null,
      createdAt: u.createdAt.toISOString(),
    }));

    // Apply spend filters in-memory (simpler than raw SQL for this use case)
    if (filters.minSpend !== undefined) {
      data = data.filter((d) => d.totalSpend >= filters.minSpend!);
    }
    if (filters.maxSpend !== undefined) {
      data = data.filter((d) => d.totalSpend <= filters.maxSpend!);
    }

    const filteredTotal = needsSpendFilter ? data.length : total;
    if (needsSpendFilter) {
      data = data.slice(skip, skip + pageSize);
    }

    return {
      data,
      total: filteredTotal,
      page,
      pageSize,
      totalPages: Math.ceil(filteredTotal / pageSize),
    };
  }

  async findOne(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            orderNumber: true,
            channel: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('Customer not found');

    const orderCount = user.orders.length;
    const totalSpend = user.orders.reduce((sum, o) => sum + o.total, 0);
    const lastOrderDate = user.orders[0]?.createdAt.toISOString() ?? null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      orderCount,
      totalSpend,
      lastOrderDate,
      createdAt: user.createdAt.toISOString(),
      orders: user.orders.map((o) => ({
        orderNumber: o.orderNumber,
        channel: o.channel,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }
}
