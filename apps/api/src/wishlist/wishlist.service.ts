import { Injectable } from '@nestjs/common';
import { prisma } from '@shopvui/db';

@Injectable()
export class WishlistService {
  async toggle(userId: string, productId: string) {
    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      return { id: existing.id, productId, action: 'already_exists' };
    }

    const created = await prisma.wishlist.create({
      data: { userId, productId },
    });

    return { id: created.id, productId, action: 'added' };
  }

  async remove(userId: string, productId: string) {
    await prisma.wishlist.deleteMany({
      where: { userId, productId },
    });
  }

  async findAll(userId: string) {
    const items = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            stockQuantity: true,
            isActive: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt.toISOString(),
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        stockQuantity: item.product.stockQuantity,
        isActive: item.product.isActive,
        imageUrl: item.product.images[0]?.url ?? null,
      },
    }));
  }

  async check(userId: string, productId: string) {
    const item = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return { inWishlist: !!item };
  }
}
