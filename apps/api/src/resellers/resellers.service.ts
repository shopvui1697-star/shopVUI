import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import type { ProposeResellerCouponDto, ApproveResellerCouponDto } from './dto/coupon.dto';

@Injectable()
export class ResellersService {
  async findAll(page = 1, pageSize = 10, status?: string) {
    const skip = (page - 1) * pageSize;
    const where = status ? { status: status as any } : {};

    const [resellers, total] = await Promise.all([
      prisma.reseller.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.reseller.count({ where }),
    ]);

    return {
      data: resellers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string) {
    const reseller = await prisma.reseller.findUnique({
      where: { id },
      include: {
        coupons: { select: { id: true, code: true, isActive: true, type: true, value: true } },
        _count: { select: { commissions: true, orders: true } },
      },
    });

    if (!reseller) throw new NotFoundException('Reseller not found');
    return reseller;
  }

  async findByUserId(userId: string) {
    const reseller = await prisma.reseller.findUnique({ where: { userId } });
    if (!reseller) throw new NotFoundException('Reseller not found');
    return reseller;
  }

  async approve(id: string) {
    const reseller = await prisma.reseller.findUnique({ where: { id } });
    if (!reseller) throw new NotFoundException('Reseller not found');
    if (reseller.status !== 'PENDING') {
      throw new ConflictException(`Cannot approve reseller with status ${reseller.status}`);
    }

    return prisma.reseller.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async reject(id: string) {
    const reseller = await prisma.reseller.findUnique({ where: { id } });
    if (!reseller) throw new NotFoundException('Reseller not found');
    if (reseller.status !== 'PENDING') {
      throw new ConflictException(`Cannot reject reseller with status ${reseller.status}`);
    }

    return prisma.reseller.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async deactivate(id: string) {
    const reseller = await prisma.reseller.findUnique({ where: { id } });
    if (!reseller) throw new NotFoundException('Reseller not found');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.reseller.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });

      await tx.coupon.updateMany({
        where: { resellerId: id, isResellerCoupon: true },
        data: { isActive: false },
      });

      return updated;
    });
  }

  async proposeCoupon(resellerId: string, dto: ProposeResellerCouponDto) {
    const existing = await prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) {
      throw new ConflictException('Coupon code already taken');
    }

    return prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        type: 'PERCENTAGE',
        isActive: false,
        isResellerCoupon: true,
        resellerId,
      },
    });
  }

  async getResellerCoupons(resellerId: string) {
    return prisma.coupon.findMany({
      where: { resellerId, isResellerCoupon: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveCoupon(couponId: string, dto: ApproveResellerCouponDto) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (!coupon.isResellerCoupon) throw new ConflictException('Not a reseller coupon');
    if (coupon.isActive) throw new ConflictException('Coupon already active');

    return prisma.coupon.update({
      where: { id: couponId },
      data: {
        type: dto.type as any,
        value: dto.value,
        maxDiscount: dto.maxDiscount,
        minPurchase: dto.minPurchase,
        commissionType: dto.commissionType,
        commissionValue: dto.commissionValue,
        commissionBase: dto.commissionBase ?? 'FINAL_TOTAL',
        maturityDays: dto.maturityDays ?? 30,
        isActive: true,
      },
    });
  }

  async updateProfile(userId: string, data: { phone?: string; bankInfo?: any; socialProfiles?: any }) {
    const reseller = await prisma.reseller.findUnique({ where: { userId } });
    if (!reseller) throw new NotFoundException('Reseller not found');

    return prisma.reseller.update({
      where: { userId },
      data: {
        phone: data.phone ?? undefined,
        bankInfo: data.bankInfo ?? undefined,
        socialProfiles: data.socialProfiles ?? undefined,
      },
    });
  }

  async getDashboardStats(resellerId: string) {
    const [orderStats, commissionStats] = await Promise.all([
      prisma.order.aggregate({
        where: { resellerId },
        _count: true,
        _sum: { total: true },
      }),
      prisma.commission.groupBy({
        by: ['status'],
        where: { resellerId },
        _sum: { commissionAmount: true },
        _count: true,
      }),
    ]);

    const commissionByStatus = Object.fromEntries(
      commissionStats.map((c) => [c.status, { count: c._count, total: c._sum.commissionAmount ?? 0 }]),
    );

    const activeCoupons = await prisma.coupon.count({
      where: { resellerId, isActive: true, isResellerCoupon: true },
    });

    return {
      totalOrders: orderStats._count,
      totalRevenue: orderStats._sum.total ?? 0,
      totalCommissionEarned:
        (commissionByStatus['APPROVED']?.total ?? 0) + (commissionByStatus['PAID']?.total ?? 0),
      totalCommissionPaid: commissionByStatus['PAID']?.total ?? 0,
      pendingCommission:
        (commissionByStatus['PENDING']?.total ?? 0) + (commissionByStatus['MATURING']?.total ?? 0),
      activeCoupons,
    };
  }
}
