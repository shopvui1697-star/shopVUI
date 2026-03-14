import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { PriceEngineService, CartCalculation } from '../price-engine/price-engine.service';

@Injectable()
export class CartService {
  constructor(private readonly priceEngine: PriceEngineService) {}

  async getCart(userId: string): Promise<CartCalculation> {
    const cart = await this.getOrCreateCart(userId);
    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });

    return this.priceEngine.calculateCart(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartCalculation> {
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');
    const cart = await this.getOrCreateCart(userId);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity: { increment: quantity } },
    });

    return this.getCart(userId);
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartCalculation> {
    const cart = await this.getOrCreateCart(userId);
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      return this.getCart(userId);
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartCalculation> {
    const cart = await this.getOrCreateCart(userId);
    await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.getCart(userId);
  }

  async mergeGuestCart(
    userId: string,
    guestItems: Array<{ productId: string; quantity: number }>,
  ): Promise<CartCalculation> {
    const cart = await this.getOrCreateCart(userId);

    const activeProducts = await prisma.product.findMany({
      where: { id: { in: guestItems.map((i) => i.productId) }, isActive: true },
      select: { id: true },
    });
    const activeIds = new Set(activeProducts.map((p) => p.id));

    for (const item of guestItems) {
      if (!activeIds.has(item.productId) || item.quantity <= 0) continue;

      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
        create: { cartId: cart.id, productId: item.productId, quantity: item.quantity },
        update: { quantity: { increment: item.quantity } },
      });
    }

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }

  private async getOrCreateCart(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }
}
