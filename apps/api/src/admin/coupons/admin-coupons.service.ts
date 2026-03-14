import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import type { CreateCouponDto, UpdateCouponDto } from './dto/admin-coupon.dto';

@Injectable()
export class AdminCouponsService {
  async findAll(page = 1, pageSize = 20) {
    page = Math.max(1, page);
    pageSize = Math.min(Math.max(1, pageSize), 100);
    const skip = (page - 1) * pageSize;

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        include: {
          reseller: { select: { name: true } },
          _count: { select: { usages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.coupon.count(),
    ]);

    return {
      data: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        isActive: c.isActive,
        usageLimit: c.usageLimit,
        timesUsed: c._count.usages,
        isResellerCoupon: c.isResellerCoupon,
        resellerName: c.reseller?.name ?? null,
        validFrom: c.validFrom?.toISOString() ?? null,
        validUntil: c.validUntil?.toISOString() ?? null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        reseller: { select: { id: true, name: true, email: true } },
        _count: { select: { usages: true } },
      },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');

    // Aggregate usage stats
    const usageStats = await prisma.couponUsage.findMany({
      where: { couponId: id },
      select: { orderId: true },
    });

    const orderIds = usageStats.map((u) => u.orderId).filter((id): id is string => id !== null);

    let totalDiscountGiven = 0;
    let associatedRevenue = 0;
    if (orderIds.length > 0) {
      const agg = await prisma.order.aggregate({
        where: { id: { in: orderIds } },
        _sum: { discountAmount: true, total: true },
      });
      totalDiscountGiven = agg._sum.discountAmount ?? 0;
      associatedRevenue = agg._sum.total ?? 0;
    }

    return {
      ...coupon,
      timesUsed: coupon._count.usages,
      totalDiscountGiven,
      associatedRevenue,
    };
  }

  async create(dto: CreateCouponDto) {
    return prisma.coupon.create({
      data: {
        code: dto.code,
        type: dto.type as any,
        value: dto.value,
        maxDiscount: dto.maxDiscount,
        minPurchase: dto.minPurchase,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        applicableCategory: dto.applicableCategory,
        buyQty: dto.buyQty,
        getQty: dto.getQty,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...dto };
    if (dto.type) data.type = dto.type;
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validUntil) data.validUntil = new Date(dto.validUntil);

    return prisma.coupon.update({ where: { id }, data });
  }

  async toggleActive(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  }

  async approveResellerCoupon(id: string, approved: boolean) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (!coupon.isResellerCoupon) throw new NotFoundException('Not a reseller coupon');

    return prisma.coupon.update({
      where: { id },
      data: { isActive: approved },
    });
  }
}
