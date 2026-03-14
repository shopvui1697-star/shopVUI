import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@shopvui/db';

@Injectable()
export class AddressesService {
  async findAll(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(
    userId: string,
    data: {
      fullName: string;
      phone: string;
      street: string;
      ward: string;
      district: string;
      province: string;
      isDefault?: boolean;
    },
  ) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data: { userId, ...data },
    });
  }

  async update(
    id: string,
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      street?: string;
      ward?: string;
      district?: string;
      province?: string;
    },
  ) {
    const address = await this.findOwnedAddress(id, userId);
    return prisma.address.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    await this.findOwnedAddress(id, userId);
    return prisma.address.delete({ where: { id } });
  }

  async setDefault(id: string, userId: string) {
    await this.findOwnedAddress(id, userId);

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return prisma.address.findUnique({ where: { id } });
  }

  private async findOwnedAddress(id: string, userId: string) {
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) throw new ForbiddenException();
    return address;
  }
}
