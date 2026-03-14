import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { CartService } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { PriceEngineService } from '../price-engine/price-engine.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { CommissionsService } from '../commissions/commissions.service';
import { EmailService } from '../email/email.service';
import type { PaymentMethod } from '@shopvui/db';

const DEFAULT_SHIPPING_FEE = 30000; // 30,000 VND flat fee

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly cartService: CartService,
    private readonly couponsService: CouponsService,
    private readonly priceEngine: PriceEngineService,
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
    private readonly commissionsService: CommissionsService,
    private readonly emailService: EmailService,
  ) {}

  async preview(userId: string, couponCode?: string) {
    const cart = await this.cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let couponDiscount = 0;
    let freeShipping = false;
    let couponMessage: string | undefined;

    if (couponCode) {
      const result = await this.couponsService.validate(
        couponCode,
        userId,
        cart.items,
        cart.subtotal,
      );
      if (result.valid) {
        couponDiscount = result.discount;
        freeShipping = result.freeShipping;
        couponMessage = result.message;
      } else {
        couponMessage = result.message;
      }
    }

    const shippingFee = freeShipping ? 0 : DEFAULT_SHIPPING_FEE;
    const total = Math.max(0, cart.subtotal - couponDiscount + shippingFee);

    return {
      items: cart.items,
      subtotal: cart.subtotal,
      couponDiscount,
      couponCode: couponCode ?? null,
      couponMessage,
      shippingFee,
      total,
    };
  }

  async placeOrder(
    userId: string,
    input: {
      addressId: string;
      paymentMethod: PaymentMethod;
      couponCode?: string;
    },
  ) {
    // Verify address belongs to user
    const address = await prisma.address.findUnique({ where: { id: input.addressId } });
    if (!address || address.userId !== userId) {
      throw new BadRequestException('Invalid address');
    }

    const cart = await this.cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let couponDiscount = 0;
    let freeShipping = false;
    let couponId: string | null = null;
    let couponRecord: any = null;

    if (input.couponCode) {
      const result = await this.couponsService.validate(
        input.couponCode,
        userId,
        cart.items,
        cart.subtotal,
      );
      if (!result.valid) {
        throw new BadRequestException(result.message);
      }
      couponDiscount = result.discount;
      freeShipping = result.freeShipping;

      couponRecord = await prisma.coupon.findUnique({ where: { code: input.couponCode } });
      couponId = couponRecord?.id ?? null;
    }

    const shippingFee = freeShipping ? 0 : DEFAULT_SHIPPING_FEE;
    const total = Math.max(0, cart.subtotal - couponDiscount + shippingFee);
    const orderNumber = await this.ordersService.generateOrderNumber();

    const isResellerCoupon = couponRecord?.isResellerCoupon === true;
    const resellerId = isResellerCoupon ? couponRecord.resellerId : null;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: input.addressId,
          paymentMethod: input.paymentMethod,
          subtotal: cart.subtotal,
          discountAmount: couponDiscount,
          shippingFee,
          total,
          couponId,
          couponCode: input.couponCode ?? null,
          channel: isResellerCoupon ? 'reseller' : 'website',
          resellerId,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
          statusHistory: {
            create: { status: 'PENDING', note: 'Order placed' },
          },
        },
      });

      // Record coupon usage
      if (couponId) {
        await tx.couponUsage.create({
          data: { couponId, userId, orderId: created.id },
        });
      }

      // Create commission for reseller coupon orders
      if (isResellerCoupon && resellerId) {
        const commissionAmount = this.commissionsService.calculateCommission(
          couponRecord,
          { subtotal: cart.subtotal, total },
        );

        if (commissionAmount > 0) {
          await this.commissionsService.createCommission({
            orderId: created.id,
            resellerId,
            couponCode: input.couponCode!,
            orderTotal: total,
            commissionAmount,
          }, tx);
        }
      }

      // Clear cart
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return created;
    });

    // Send reseller notification email (fire-and-forget)
    if (isResellerCoupon && resellerId) {
      const reseller = await prisma.reseller.findUnique({ where: { id: resellerId } });
      if (reseller) {
        const commissionAmount = this.commissionsService.calculateCommission(
          couponRecord,
          { subtotal: cart.subtotal, total },
        );
        this.emailService.sendResellerNewOrder({
          resellerEmail: reseller.email,
          resellerName: reseller.name,
          orderId: order.id,
          orderNumber,
          products: cart.items.map((i) => i.productName),
          orderTotal: total,
          estimatedCommission: commissionAmount,
          customerCity: address.province ?? '',
        });
      }
    }

    // Initiate payment (outside transaction - external service)
    const paymentResult = await this.paymentsService.initiatePayment(
      order.id,
      order.orderNumber,
      order.total,
      input.paymentMethod,
    );

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      redirectUrl: paymentResult.redirectUrl,
    };
  }
}
