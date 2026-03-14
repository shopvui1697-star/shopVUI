import { Injectable } from '@nestjs/common';
import { prisma } from '@shopvui/db';

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface CalculatedCartItem {
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tierApplied: string | null;
}

export interface CartCalculation {
  items: CalculatedCartItem[];
  subtotal: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
}

@Injectable()
export class PriceEngineService {
  async getUnitPrice(productId: string, quantity: number): Promise<number> {
    const tier = await prisma.priceTier.findFirst({
      where: {
        productId,
        minQty: { lte: quantity },
        OR: [{ maxQty: { gte: quantity } }, { maxQty: null }],
      },
      orderBy: { minQty: 'desc' },
    });

    if (tier) return tier.price;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { price: true },
    });

    return product?.price ?? 0;
  }

  async calculateCart(items: CartItemInput[]): Promise<CartCalculation> {
    if (items.length === 0) {
      return { items: [], subtotal: 0, couponDiscount: 0, shippingFee: 0, total: 0 };
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isActive: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        priceTiers: { orderBy: { minQty: 'asc' } },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const calculated: CalculatedCartItem[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      const tier = product.priceTiers.find(
        (t) => item.quantity >= t.minQty && (t.maxQty === null || item.quantity <= t.maxQty),
      );

      const unitPrice = tier?.price ?? product.price;
      const tierLabel = tier
        ? `${tier.minQty}${tier.maxQty ? `-${tier.maxQty}` : '+'}`
        : null;

      calculated.push({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0]?.url ?? null,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
        tierApplied: tierLabel,
      });
    }

    const subtotal = calculated.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      items: calculated,
      subtotal,
      couponDiscount: 0,
      shippingFee: 0,
      total: subtotal,
    };
  }
}
