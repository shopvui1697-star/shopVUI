import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@shopvui/db';

@Injectable()
export class PriceTiersService {
  async findByProduct(productId: string) {
    return prisma.priceTier.findMany({
      where: { productId },
      orderBy: { minQty: 'asc' },
    });
  }

  async create(productId: string, data: { minQty: number; maxQty?: number; price: number }) {
    if (data.minQty <= 0) throw new BadRequestException('minQty must be positive');
    if (data.price < 0) throw new BadRequestException('price must not be negative');
    if (data.maxQty !== undefined && data.maxQty !== null && data.maxQty < data.minQty) {
      throw new BadRequestException('maxQty must be >= minQty');
    }
    await this.validateNoOverlap(productId, data.minQty, data.maxQty ?? null);

    return prisma.priceTier.create({
      data: {
        productId,
        minQty: data.minQty,
        maxQty: data.maxQty ?? null,
        price: data.price,
      },
    });
  }

  async update(id: string, data: { minQty?: number; maxQty?: number; price?: number }) {
    const tier = await prisma.priceTier.findUnique({ where: { id } });
    if (!tier) throw new NotFoundException('Price tier not found');

    const minQty = data.minQty ?? tier.minQty;
    const maxQty = data.maxQty !== undefined ? data.maxQty : tier.maxQty;

    await this.validateNoOverlap(tier.productId, minQty, maxQty ?? null, id);

    return prisma.priceTier.update({
      where: { id },
      data: { minQty, maxQty, price: data.price },
    });
  }

  async delete(id: string) {
    const tier = await prisma.priceTier.findUnique({ where: { id } });
    if (!tier) throw new NotFoundException('Price tier not found');
    return prisma.priceTier.delete({ where: { id } });
  }

  private async validateNoOverlap(
    productId: string,
    minQty: number,
    maxQty: number | null,
    excludeId?: string,
  ) {
    const existing = await prisma.priceTier.findMany({
      where: { productId, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });

    for (const tier of existing) {
      const tierMax = tier.maxQty ?? Infinity;
      const newMax = maxQty ?? Infinity;

      if (minQty <= tierMax && newMax >= tier.minQty) {
        throw new BadRequestException(
          `Price tier overlaps with existing tier (${tier.minQty}-${tier.maxQty ?? '∞'})`,
        );
      }
    }
  }
}
