import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef, Logger } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { CommissionsService } from '../commissions/commissions.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(forwardRef(() => CommissionsService))
    private readonly commissionsService: CommissionsService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(userId: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders.map((o) => ({
        orderNumber: o.orderNumber,
        date: o.createdAt.toISOString(),
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        itemCount: o.items.length,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(orderNumber: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
            },
          },
        },
        address: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException();

    return {
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString(),
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      itemCount: order.items.length,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        productImage: i.product.images[0]?.url ?? null,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      address: order.address
        ? {
            id: order.address.id,
            fullName: order.address.fullName,
            phone: order.address.phone,
            street: order.address.street,
            ward: order.address.ward,
            district: order.address.district,
            province: order.address.province,
            isDefault: order.address.isDefault,
          }
        : null,
      couponCode: order.couponCode,
      discountAmount: order.discountAmount,
      shippingFee: order.shippingFee,
      subtotal: order.subtotal,
      statusHistory: order.statusHistory.map((h) => ({
        status: h.status,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  async cancel(orderNumber: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { orderNumber } });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException();
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { orderNumber },
        data: { status: 'CANCELLED' },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          note: 'Cancelled by customer',
        },
      });

      return updated;
    });

    // Create in-app notification for cancellation (fire-and-forget)
    this.notificationService.create({
      targetUserIds: [userId],
      type: 'ORDER_STATUS',
      title: `Order ${orderNumber} cancelled`,
      body: `Your order ${orderNumber} has been cancelled.`,
      metadata: { orderNumber, status: 'CANCELLED' },
    }).catch((err) => {
      this.logger.error(`Failed to create cancellation notification for order ${orderNumber}`, err);
    });

    return result;
  }

  async generateOrderNumber(retries = 3): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const prefix = `SV-${dateStr}-`;

    for (let attempt = 0; attempt < retries; attempt++) {
      const lastOrder = await prisma.order.findFirst({
        where: { orderNumber: { startsWith: prefix } },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });

      let seq = 1;
      if (lastOrder) {
        const lastSeq = parseInt(lastOrder.orderNumber.split('-').pop() ?? '0', 10);
        seq = lastSeq + 1 + attempt; // offset by attempt to avoid collision
      }

      const orderNumber = `${prefix}${seq.toString().padStart(4, '0')}`;

      // Verify uniqueness
      const existing = await prisma.order.findUnique({
        where: { orderNumber },
        select: { id: true },
      });
      if (!existing) return orderNumber;
    }

    // Fallback: use timestamp suffix for guaranteed uniqueness
    return `${prefix}${Date.now().toString().slice(-6)}`;
  }

  async updateStatus(orderNumber: string, newStatus: string, note?: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { commissions: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { orderNumber },
        data: { status: newStatus as any },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: newStatus as any,
          note: note ?? `Status updated to ${newStatus}`,
        },
      });

      return updated;
    });

    // Create in-app notification for the customer
    if (order.userId) {
      const statusLabels: Record<string, string> = {
        CONFIRMED: 'confirmed',
        SHIPPING: 'shipping',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled',
        RETURNED: 'returned',
      };
      const label = statusLabels[newStatus] ?? newStatus.toLowerCase();
      this.notificationService.create({
        targetUserIds: [order.userId],
        type: 'ORDER_STATUS',
        title: `Order ${orderNumber} ${label}`,
        body: `Your order ${orderNumber} has been ${label}.`,
        metadata: { orderNumber, status: newStatus },
      }).catch((err) => {
        this.logger.error(`Failed to create notification for order ${orderNumber}`, err);
      });
    }

    // Commission lifecycle hooks (fire after transaction)
    if (order.resellerId) {
      try {
        if (newStatus === 'DELIVERED') {
          const coupon = order.couponCode
            ? await prisma.coupon.findUnique({ where: { code: order.couponCode } })
            : null;
          const maturityDays = coupon?.maturityDays ?? 30;
          await this.commissionsService.transitionToMaturing(order.id, new Date(), maturityDays);
        } else if (newStatus === 'CANCELLED') {
          await this.commissionsService.voidByOrderId(order.id, 'Order cancelled');
        } else if (newStatus === 'RETURNED') {
          await this.commissionsService.voidByOrderId(order.id, 'Order returned');
        }
        // Send email notifications to reseller
        const reseller = await prisma.reseller.findUnique({ where: { id: order.resellerId! } });
        if (reseller) {
          if (newStatus === 'DELIVERED') {
            const coupon = order.couponCode
              ? await prisma.coupon.findUnique({ where: { code: order.couponCode } })
              : null;
            const matDays = coupon?.maturityDays ?? 30;
            const matDate = new Date();
            matDate.setDate(matDate.getDate() + matDays);
            this.emailService.sendResellerOrderDelivered({
              resellerEmail: reseller.email,
              resellerName: reseller.name,
              orderNumber,
              deliveredAt: new Date().toISOString(),
              maturityDate: matDate.toISOString(),
            });
          } else if (newStatus === 'CANCELLED' || newStatus === 'RETURNED') {
            this.emailService.sendResellerCommissionVoided({
              resellerEmail: reseller.email,
              resellerName: reseller.name,
              orderNumber,
              voidReason: newStatus === 'CANCELLED' ? 'Order cancelled' : 'Order returned',
            });
          }
        }
      } catch (error) {
        this.logger.error(`Commission lifecycle hook failed for order ${orderNumber}`, error);
      }
    }

    return result;
  }
}
