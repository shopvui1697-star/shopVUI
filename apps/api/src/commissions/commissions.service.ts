import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { EmailService } from '../email/email.service';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(private readonly emailService: EmailService) {}

  calculateCommission(coupon: {
    commissionType: string | null;
    commissionValue: number | null;
    commissionBase: string | null;
  }, order: { subtotal: number; total: number }): number {
    if (!coupon.commissionType || !coupon.commissionValue) return 0;

    const base = coupon.commissionBase === 'SUBTOTAL' ? order.subtotal : order.total;

    if (coupon.commissionType === 'PERCENTAGE') {
      return Math.round(base * coupon.commissionValue / 100);
    }

    return coupon.commissionValue;
  }

  async createCommission(data: {
    orderId: string;
    resellerId: string;
    couponCode: string;
    orderTotal: number;
    commissionAmount: number;
  }, tx?: any) {
    const db = tx ?? prisma;
    return db.commission.create({ data });
  }

  async transitionToMaturing(orderId: string, deliveredAt: Date, maturityDays: number) {
    const maturityDate = new Date(deliveredAt);
    maturityDate.setDate(maturityDate.getDate() + maturityDays);

    return prisma.commission.updateMany({
      where: { orderId, status: 'PENDING' },
      data: {
        status: 'MATURING',
        orderDeliveredAt: deliveredAt,
        maturityDate,
      },
    });
  }

  async voidByOrderId(orderId: string, reason: string) {
    return prisma.commission.updateMany({
      where: {
        orderId,
        status: { in: ['PENDING', 'MATURING'] },
      },
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
        voidReason: reason,
      },
    });
  }

  async approveMaturedCommissions() {
    const now = new Date();

    const matured = await prisma.commission.findMany({
      where: {
        status: 'MATURING',
        maturityDate: { lte: now },
      },
      include: { reseller: { select: { id: true, email: true, name: true } } },
    });

    if (matured.length === 0) return { approved: 0, resellers: [] };

    await prisma.commission.updateMany({
      where: {
        id: { in: matured.map((c) => c.id) },
      },
      data: {
        status: 'APPROVED',
        approvedAt: now,
      },
    });

    const resellerMap = new Map<string, { email: string; name: string; commissions: typeof matured }>();
    for (const c of matured) {
      if (!resellerMap.has(c.resellerId)) {
        resellerMap.set(c.resellerId, { email: c.reseller.email, name: c.reseller.name, commissions: [] });
      }
      resellerMap.get(c.resellerId)!.commissions.push(c);
    }

    const resellers = Array.from(resellerMap.entries()).map(([id, data]) => ({
      resellerId: id,
      email: data.email,
      name: data.name,
      commissionCount: data.commissions.length,
      totalAmount: data.commissions.reduce((sum, c) => sum + c.commissionAmount, 0),
    }));

    // Send approval emails (fire-and-forget)
    for (const r of resellers) {
      this.emailService.sendResellerCommissionApproved({
        resellerEmail: r.email,
        resellerName: r.name,
        commissionAmount: r.totalAmount,
        commissionCount: r.commissionCount,
      });
    }

    return { approved: matured.length, resellers };
  }

  async processPayouts(commissionIds: string[]) {
    const result = await prisma.$transaction(async (tx) => {
      const commissions = await tx.commission.findMany({
        where: { id: { in: commissionIds } },
        include: { reseller: { select: { id: true, email: true, name: true } } },
      });

      const nonApproved = commissions.filter((c) => c.status !== 'APPROVED');
      if (nonApproved.length > 0) {
        throw new ConflictException(
          `Cannot process payout: ${nonApproved.length} commission(s) not in APPROVED status`,
        );
      }

      await tx.commission.updateMany({
        where: { id: { in: commissionIds } },
        data: { status: 'PAID', paidAt: new Date() },
      });

      const resellerMap = new Map<string, { email: string; name: string; totalAmount: number }>();
      for (const c of commissions) {
        const existing = resellerMap.get(c.resellerId);
        if (existing) {
          existing.totalAmount += c.commissionAmount;
        } else {
          resellerMap.set(c.resellerId, {
            email: c.reseller.email,
            name: c.reseller.name,
            totalAmount: c.commissionAmount,
          });
        }
      }

      const payoutResellers = Array.from(resellerMap.entries()).map(([id, data]) => ({
        resellerId: id,
        ...data,
      }));

      return { paid: commissions.length, resellers: payoutResellers };
    });

    // Send payout emails after transaction (fire-and-forget)
    for (const r of result.resellers) {
      this.emailService.sendResellerCommissionPaid({
        resellerEmail: r.email,
        resellerName: r.name,
        totalAmount: r.totalAmount,
        paidAt: new Date().toISOString(),
      });
    }

    return result;
  }

  async findByReseller(resellerId: string, status?: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const where: any = { resellerId };
    if (status) where.status = status;

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: { order: { select: { orderNumber: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.commission.count({ where }),
    ]);

    return {
      data: commissions.map((c) => ({
        id: c.id,
        orderId: c.orderId,
        orderNumber: c.order.orderNumber,
        couponCode: c.couponCode,
        orderTotal: c.orderTotal,
        commissionAmount: c.commissionAmount,
        status: c.status,
        orderDeliveredAt: c.orderDeliveredAt?.toISOString() ?? null,
        maturityDate: c.maturityDate?.toISOString() ?? null,
        approvedAt: c.approvedAt?.toISOString() ?? null,
        paidAt: c.paidAt?.toISOString() ?? null,
        voidedAt: c.voidedAt?.toISOString() ?? null,
        voidReason: c.voidReason,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findAll(status?: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (status) where.status = status;

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          reseller: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.commission.count({ where }),
    ]);

    return {
      data: commissions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
