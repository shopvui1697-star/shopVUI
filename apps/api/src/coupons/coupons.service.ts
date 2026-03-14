import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import type { Coupon } from '@shopvui/db';
import type { CalculatedCartItem } from '../price-engine/price-engine.service';

export interface CouponDiscount {
  valid: boolean;
  discount: number;
  message: string;
  freeShipping: boolean;
}

@Injectable()
export class CouponsService {
  async validate(
    code: string,
    userId: string,
    cartItems: CalculatedCartItem[],
    subtotal: number,
  ): Promise<CouponDiscount> {
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      return { valid: false, discount: 0, message: 'Coupon not found', freeShipping: false };
    }

    // Expiry check
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      return { valid: false, discount: 0, message: 'Coupon has expired', freeShipping: false };
    }

    if (coupon.validFrom && new Date() < coupon.validFrom) {
      return { valid: false, discount: 0, message: 'Coupon is not yet active', freeShipping: false };
    }

    // Global usage limit
    if (coupon.usageLimit) {
      const usageCount = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
      if (usageCount >= coupon.usageLimit) {
        return { valid: false, discount: 0, message: 'Coupon usage limit reached', freeShipping: false };
      }
    }

    // Per-user limit
    if (coupon.perUserLimit) {
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsageCount >= coupon.perUserLimit) {
        return { valid: false, discount: 0, message: 'You have already used this coupon', freeShipping: false };
      }
    }

    // Min purchase
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum purchase of ${coupon.minPurchase.toLocaleString()} VND required`,
        freeShipping: false,
      };
    }

    // Category restriction
    if (coupon.applicableCategory) {
      const categoryProducts = await prisma.product.findMany({
        where: {
          id: { in: cartItems.map((i) => i.productId) },
          category: { slug: coupon.applicableCategory },
        },
        select: { id: true },
      });
      if (categoryProducts.length === 0) {
        return {
          valid: false,
          discount: 0,
          message: 'Coupon not applicable to items in cart',
          freeShipping: false,
        };
      }
    }

    // Calculate discount based on type
    return this.calculateDiscount(coupon, cartItems, subtotal);
  }

  private calculateDiscount(
    coupon: Coupon,
    cartItems: CalculatedCartItem[],
    subtotal: number,
  ): CouponDiscount {
    switch (coupon.type) {
      case 'PERCENTAGE': {
        let discount = Math.floor((subtotal * (coupon.value ?? 0)) / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
        return { valid: true, discount, message: 'Coupon applied', freeShipping: false };
      }

      case 'FIXED': {
        const discount = Math.min(coupon.value ?? 0, subtotal);
        return { valid: true, discount, message: 'Coupon applied', freeShipping: false };
      }

      case 'FREE_SHIPPING': {
        return { valid: true, discount: 0, message: 'Free shipping applied', freeShipping: true };
      }

      case 'BUY_X_GET_Y': {
        const buyQty = coupon.buyQty ?? 0;
        const getQty = coupon.getQty ?? 0;
        const requiredQty = buyQty + getQty;

        const qualifying = cartItems.filter((i) => i.quantity >= requiredQty);
        if (qualifying.length === 0) {
          return {
            valid: false,
            discount: 0,
            message: `Need at least ${requiredQty} of an item to use this coupon`,
            freeShipping: false,
          };
        }

        // Free items = getQty * cheapest qualifying unit price
        const cheapestPrice = Math.min(...qualifying.map((i) => i.unitPrice));
        const discount = cheapestPrice * getQty;
        return { valid: true, discount, message: 'Coupon applied', freeShipping: false };
      }

      default:
        return { valid: false, discount: 0, message: 'Unknown coupon type', freeShipping: false };
    }
  }

  async create(data: {
    code: string;
    type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
    value?: number;
    maxDiscount?: number;
    minPurchase?: number;
    usageLimit?: number;
    perUserLimit?: number;
    validFrom?: string;
    validUntil?: string;
    applicableCategory?: string;
    buyQty?: number;
    getQty?: number;
  }) {
    return prisma.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        maxDiscount: data.maxDiscount,
        minPurchase: data.minPurchase,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        applicableCategory: data.applicableCategory,
        buyQty: data.buyQty,
        getQty: data.getQty,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return prisma.coupon.update({ where: { id }, data });
  }

  async deactivate(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }
}
