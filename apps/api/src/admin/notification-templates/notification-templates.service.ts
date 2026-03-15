import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import type { NotificationType } from '@shopvui/shared';

@Injectable()
export class NotificationTemplatesService {
  async findAll() {
    return prisma.notificationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    name: string;
    title: string;
    body: string;
    type: NotificationType;
    autoShow?: boolean;
  }) {
    return prisma.notificationTemplate.create({
      data: {
        name: data.name,
        title: data.title,
        body: data.body,
        type: data.type,
        autoShow: data.autoShow ?? false,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      title?: string;
      body?: string;
      type?: NotificationType;
      autoShow?: boolean;
    },
  ) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template not found');

    return prisma.notificationTemplate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template not found');

    await prisma.notificationTemplate.delete({ where: { id } });
  }
}
