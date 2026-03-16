import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import type { Prisma } from '@prisma/client';
import type { NotificationType } from '@shopvui/shared';

@Injectable()
export class NotificationService {
  async create(data: {
    targetUserIds: string[];
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    templateId?: string;
  }) {
    return prisma.notification.create({
      data: {
        targetUserIds: data.targetUserIds,
        type: data.type,
        title: data.title,
        body: data.body,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
        templateId: data.templateId,
        readByUserIds: [],
      },
    });
  }

  async createFromTemplate(
    templateId: string,
    targetUserIds: string[],
    overrides?: {
      title?: string;
      body?: string;
      metadata?: Record<string, unknown>;
      variables?: Record<string, string>;
    },
  ) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Notification template not found');
    }

    let title = overrides?.title ?? template.title;
    let body = overrides?.body ?? template.body;

    if (overrides?.variables) {
      title = this.interpolate(title, overrides.variables);
      body = this.interpolate(body, overrides.variables);
    }

    return this.create({
      targetUserIds,
      type: template.type,
      title,
      body,
      metadata: overrides?.metadata,
      templateId,
    });
  }

  private interpolate(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }

  async findByUser(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    // Find notifications where targetUserIds contains userId or "*"
    const where: Prisma.NotificationWhereInput = {
      OR: [
        { targetUserIds: { array_contains: [userId] } },
        { targetUserIds: { array_contains: ['*'] } },
      ],
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { template: { select: { autoShow: true } } },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications.map((n) => {
        const readByUserIds = (n.readByUserIds as string[]) || [];
        return {
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          isRead: readByUserIds.includes(userId),
          metadata: n.metadata as Record<string, unknown> | null,
          templateId: n.templateId,
          autoShow: n.template?.autoShow ?? false,
          createdAt: n.createdAt.toISOString(),
        };
      }),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Count notifications targeting this user where they haven't read
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetUserIds: { array_contains: [userId] } },
          { targetUserIds: { array_contains: ['*'] } },
        ],
      },
      select: { readByUserIds: true },
    });

    return notifications.filter((n) => {
      const readBy = (n.readByUserIds as string[]) || [];
      return !readBy.includes(userId);
    }).length;
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Verify user is a target
    const targets = notification.targetUserIds as string[];
    if (!targets.includes(userId) && !targets.includes('*')) {
      throw new NotFoundException('Notification not found');
    }

    const readBy = (notification.readByUserIds as string[]) || [];
    if (!readBy.includes(userId)) {
      await prisma.notification.update({
        where: { id },
        data: { readByUserIds: [...readBy, userId] },
      });
    }
  }

  async notifyAdmins(data: {
    senderId: string;
    senderName: string;
    productId: string;
    productName: string;
    message?: string;
  }) {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admins.length === 0) return null;

    const body = data.message
      ? `${data.senderName} says: "${data.message}" — Product: ${data.productName}`
      : `${data.senderName} is interested in "${data.productName}"`;

    return this.create({
      targetUserIds: admins.map((a) => a.id),
      type: 'CONVERSATION',
      title: 'Customer inquiry about a product',
      body,
      metadata: {
        senderId: data.senderId,
        productId: data.productId,
      },
    });
  }

  async replyToInquiry(notificationId: string, adminId: string, message: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const metadata = notification.metadata as Record<string, unknown> | null;
    const senderId = metadata?.senderId as string | undefined;
    if (!senderId) {
      throw new BadRequestException('This notification does not have a sender to reply to');
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { name: true, email: true },
    });

    const adminName = admin?.name ?? admin?.email ?? 'Admin';
    const productId = metadata?.productId as string | undefined;

    return this.create({
      targetUserIds: [senderId],
      type: 'CONVERSATION',
      title: `Reply from ${adminName}`,
      body: message,
      metadata: {
        replyToNotificationId: notificationId,
        adminId,
        ...(productId && { productId }),
        originalTitle: notification.title,
        originalBody: notification.body,
      },
    });
  }

  async getProductHistory(userId: string, productId: string) {
    const notifications = await prisma.notification.findMany({
      where: {
        metadata: { path: '$.productId', equals: productId },
      },
      orderBy: { createdAt: 'asc' },
    });

    return notifications
      .filter((n) => {
        const meta = n.metadata as Record<string, unknown> | null;
        const targets = n.targetUserIds as string[];
        const isSentByUser = meta?.senderId === userId;
        const isReplyToUser = targets.includes(userId) && !!meta?.replyToNotificationId;
        return isSentByUser || isReplyToUser;
      })
      .map((n) => {
        const meta = n.metadata as Record<string, unknown> | null;
        return {
          id: n.id,
          title: n.title,
          body: n.body,
          type: meta?.senderId === userId ? 'sent' as const : 'reply' as const,
          createdAt: n.createdAt.toISOString(),
        };
      });
  }

  async markAllAsRead(userId: string): Promise<void> {
    // Get all unread notifications for this user
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetUserIds: { array_contains: [userId] } },
          { targetUserIds: { array_contains: ['*'] } },
        ],
      },
      select: { id: true, readByUserIds: true },
    });

    const updates = notifications
      .filter((n) => {
        const readBy = (n.readByUserIds as string[]) || [];
        return !readBy.includes(userId);
      })
      .map((n) => {
        const readBy = (n.readByUserIds as string[]) || [];
        return prisma.notification.update({
          where: { id: n.id },
          data: { readByUserIds: [...readBy, userId] },
        });
      });

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }
  }
}
