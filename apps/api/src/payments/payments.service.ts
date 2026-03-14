import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@shopvui/db';
import * as crypto from 'crypto';

export interface PaymentInitResult {
  paymentRef: string;
  redirectUrl?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly config: ConfigService) {}

  async initiatePayment(
    orderId: string,
    orderNumber: string,
    total: number,
    method: 'VNPAY' | 'MOMO' | 'BANK_TRANSFER' | 'COD',
  ): Promise<PaymentInitResult> {
    const paymentRef = `PAY-${orderNumber}-${Date.now()}`;

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentRef },
    });

    switch (method) {
      case 'VNPAY':
        return { paymentRef, redirectUrl: this.buildVnpayUrl(paymentRef, total, orderNumber) };
      case 'MOMO':
        return { paymentRef, redirectUrl: this.buildMomoUrl(paymentRef, total, orderNumber) };
      case 'COD':
      case 'BANK_TRANSFER':
        return { paymentRef };
      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }

  async handleVnpayIpn(query: Record<string, string>): Promise<{ RspCode: string; Message: string }> {
    const secureHash = query['vnp_SecureHash'];
    const secretKey = this.config.get<string>('VNPAY_HASH_SECRET', 'vnpay-secret');

    // Remove hash fields for verification
    const verifyParams = { ...query };
    delete verifyParams['vnp_SecureHash'];
    delete verifyParams['vnp_SecureHashType'];

    const sortedKeys = Object.keys(verifyParams).sort();
    const signData = sortedKeys.map((k) => `${k}=${verifyParams[k]}`).join('&');
    const expectedHash = crypto
      .createHmac('sha512', secretKey)
      .update(signData)
      .digest('hex');

    if (secureHash !== expectedHash) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const paymentRef = query['vnp_TxnRef'];
    const responseCode = query['vnp_ResponseCode'];

    const order = await prisma.order.findFirst({ where: { paymentRef } });
    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    if (order.paymentStatus === 'PAID') {
      return { RspCode: '02', Message: 'Already processed' };
    }

    if (responseCode === '00') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
        });
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, status: 'CONFIRMED', note: 'Payment confirmed via VNPay' },
        });
      });
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  async handleMomoIpn(body: Record<string, any>): Promise<{ resultCode: number; message: string }> {
    const { orderId: paymentRef, resultCode, signature } = body;

    // Signature verification placeholder - in production, verify RSA signature
    const secretKey = this.config.get<string>('MOMO_SECRET_KEY', 'momo-secret');

    const order = await prisma.order.findFirst({ where: { paymentRef } });
    if (!order) {
      return { resultCode: 1, message: 'Order not found' };
    }

    if (order.paymentStatus === 'PAID') {
      return { resultCode: 0, message: 'Already processed' };
    }

    if (resultCode === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
        });
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, status: 'CONFIRMED', note: 'Payment confirmed via Momo' },
        });
      });
    }

    return { resultCode: 0, message: 'Success' };
  }

  private buildVnpayUrl(paymentRef: string, amount: number, orderInfo: string): string {
    const vnpUrl = this.config.get<string>('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    const tmnCode = this.config.get<string>('VNPAY_TMN_CODE', 'DEMO');
    const secretKey = this.config.get<string>('VNPAY_HASH_SECRET', 'vnpay-secret');
    const returnUrl = this.config.get<string>('VNPAY_RETURN_URL', 'http://localhost:3000/checkout/result');

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: (amount * 100).toString(),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: paymentRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: this.formatVnpayDate(new Date()),
    };

    const sortedKeys = Object.keys(params).sort();
    const signData = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    const hash = crypto.createHmac('sha512', secretKey).update(signData).digest('hex');

    params['vnp_SecureHash'] = hash;

    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    return `${vnpUrl}?${queryString}`;
  }

  private buildMomoUrl(paymentRef: string, amount: number, orderInfo: string): string {
    const momoEndpoint = this.config.get<string>('MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create');
    const returnUrl = this.config.get<string>('MOMO_RETURN_URL', 'http://localhost:3000/checkout/result');
    // In production, this would make an API call to Momo to get the payment URL
    // For now, return a placeholder that indicates the integration point
    return `${returnUrl}?paymentRef=${paymentRef}&method=momo`;
  }

  private formatVnpayDate(date: Date): string {
    return (
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0')
    );
  }
}
