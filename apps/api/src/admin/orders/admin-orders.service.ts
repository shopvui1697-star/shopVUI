import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { CommissionsService } from '../../commissions/commissions.service';
import { buildInvoiceHtml } from './invoice-template';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING'],
  SHIPPING: ['DELIVERED', 'RETURNED'],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(private readonly commissionsService: CommissionsService) {}

  async findAll(filters: {
    channel?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(Math.max(1, filters.pageSize ?? 20), 100);
    const skip = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters.channel) where.channel = filters.channel;
    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerPhone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail,
        channel: o.channel,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        total: o.total,
        itemCount: o.items.length,
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true, name: true } },
        address: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        reseller: { select: { id: true, name: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const coupon = order.couponCode
      ? await prisma.coupon.findUnique({
          where: { code: order.couponCode },
          select: { id: true, code: true, type: true },
        })
      : null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      channel: order.channel,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingFee: order.shippingFee,
      couponCode: order.couponCode,
      resellerId: order.resellerId,
      itemCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      address: order.address
        ? {
            fullName: order.address.fullName,
            phone: order.address.phone,
            street: order.address.street,
            ward: order.address.ward,
            district: order.address.district,
            province: order.address.province,
          }
        : null,
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
      })),
      user: order.user,
      coupon,
      reseller: order.reseller,
    };
  }

  async updateStatus(id: string, newStatus: string, note?: string) {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundException('Order not found');

      const allowedNext = VALID_TRANSITIONS[order.status] ?? [];
      if (!allowedNext.includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition from ${order.status} to ${newStatus}. Allowed: ${allowedNext.join(', ')}`,
        );
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: newStatus as any },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: newStatus as any,
          note: note ?? `Status updated to ${newStatus}`,
        },
      });

      return { updated, order };
    });

    // Commission lifecycle hooks (outside transaction - fire and forget with logging)
    let commissionWarning: string | null = null;

    if (result.order.resellerId) {
      try {
        if (newStatus === 'DELIVERED') {
          const coupon = result.order.couponCode
            ? await prisma.coupon.findUnique({ where: { code: result.order.couponCode } })
            : null;
          const maturityDays = coupon?.maturityDays ?? 30;
          await this.commissionsService.transitionToMaturing(result.order.id, new Date(), maturityDays);
        } else if (newStatus === 'CANCELLED') {
          await this.commissionsService.voidByOrderId(result.order.id, 'Order cancelled');
        } else if (newStatus === 'RETURNED') {
          await this.commissionsService.voidByOrderId(result.order.id, 'Order returned');
        }
      } catch (error) {
        this.logger.error(`Commission hook failed for order ${id}`, error);
        commissionWarning = 'Order status updated but commission processing failed. Please check manually.';
      }
    }

    return { ...result.updated, commissionWarning };
  }

  async bulkAction(orderIds: string[], action: 'mark_shipped' | 'export_csv') {
    if (action === 'mark_shipped') {
      const results = await Promise.allSettled(
        orderIds.map((id) => this.updateStatus(id, 'SHIPPING', 'Bulk mark shipped')),
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { succeeded, failed, total: orderIds.length };
    }

    if (action === 'export_csv') {
      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: { items: true },
      });

      const esc = (v: unknown) => {
        const s = String(v ?? '');
        // Strip formula prefixes and quote fields containing commas/quotes/newlines
        const safe = s.replace(/^[=+\-@\t\r]/, "'$&");
        return safe.includes(',') || safe.includes('"') || safe.includes('\n')
          ? `"${safe.replace(/"/g, '""')}"`
          : safe;
      };

      const header = 'orderNumber,channel,status,paymentStatus,total,itemCount,createdAt';
      const rows = orders.map(
        (o) =>
          [o.orderNumber, o.channel, o.status, o.paymentStatus, o.total, o.items.length, o.createdAt.toISOString()].map(esc).join(','),
      );
      return { csv: [header, ...rows].join('\n') };
    }

    throw new BadRequestException(`Unknown action: ${action}`);
  }

  async renderInvoices(ids: string[]): Promise<string> {
    if (!ids.length) {
      throw new BadRequestException('No order IDs provided');
    }
    if (ids.length > 50) {
      throw new BadRequestException(
        'Maximum 50 orders per invoice request. Please reduce your selection.',
      );
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: ids } },
      include: {
        items: { include: { product: { select: { name: true } } } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return buildInvoiceHtml(orders);
  }
}
