import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface ResellerNewOrderData {
  resellerEmail: string;
  resellerName: string;
  orderId: string;
  orderNumber: string;
  products: string[];
  orderTotal: number;
  estimatedCommission: number;
  customerCity: string;
}

interface ResellerOrderDeliveredData {
  resellerEmail: string;
  resellerName: string;
  orderNumber: string;
  deliveredAt: string;
  maturityDate: string;
}

interface ResellerCommissionApprovedData {
  resellerEmail: string;
  resellerName: string;
  commissionAmount: number;
  commissionCount: number;
}

interface ResellerCommissionPaidData {
  resellerEmail: string;
  resellerName: string;
  totalAmount: number;
  paidAt: string;
}

interface ResellerCommissionVoidedData {
  resellerEmail: string;
  resellerName: string;
  orderNumber: string;
  voidReason: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('SMTP_PORT', 587),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    } else {
      // Dev/test: use JSON transport (logs to console)
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.logger.warn('SMTP not configured — using JSON transport (emails logged, not sent)');
    }
  }

  async sendResellerNewOrder(data: ResellerNewOrderData): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', 'noreply@shopvui.com'),
        to: data.resellerEmail,
        subject: `New order via your coupon! Order #${data.orderNumber}`,
        html: `
          <h2>Hi ${data.resellerName},</h2>
          <p>A customer just placed an order using your coupon code!</p>
          <ul>
            <li><strong>Order:</strong> #${data.orderNumber}</li>
            <li><strong>Products:</strong> ${data.products.join(', ')}</li>
            <li><strong>Order Total:</strong> ${data.orderTotal.toLocaleString()} VND</li>
            <li><strong>Estimated Commission:</strong> ${data.estimatedCommission.toLocaleString()} VND</li>
            <li><strong>Customer City:</strong> ${data.customerCity}</li>
          </ul>
          <p>You'll earn this commission after the order is delivered and the maturity period completes.</p>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send new order email to ${data.resellerEmail}`, error);
    }
  }

  async sendResellerOrderDelivered(data: ResellerOrderDeliveredData): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', 'noreply@shopvui.com'),
        to: data.resellerEmail,
        subject: `Order #${data.orderNumber} delivered — maturity period started`,
        html: `
          <h2>Hi ${data.resellerName},</h2>
          <p>Order #${data.orderNumber} has been delivered on ${data.deliveredAt}.</p>
          <p>The 30-day maturity period has started. If no return/refund occurs, your commission will be approved on ${data.maturityDate}.</p>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send delivery email to ${data.resellerEmail}`, error);
    }
  }

  async sendResellerCommissionApproved(data: ResellerCommissionApprovedData): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', 'noreply@shopvui.com'),
        to: data.resellerEmail,
        subject: `Commission approved — ${data.commissionAmount.toLocaleString()} VND ready for payout`,
        html: `
          <h2>Hi ${data.resellerName},</h2>
          <p>${data.commissionCount} commission(s) totaling ${data.commissionAmount.toLocaleString()} VND have been approved and are ready for payout!</p>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send approval email to ${data.resellerEmail}`, error);
    }
  }

  async sendResellerCommissionPaid(data: ResellerCommissionPaidData): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', 'noreply@shopvui.com'),
        to: data.resellerEmail,
        subject: `Commission paid — ${data.totalAmount.toLocaleString()} VND`,
        html: `
          <h2>Hi ${data.resellerName},</h2>
          <p>Your commission of ${data.totalAmount.toLocaleString()} VND has been paid on ${data.paidAt}.</p>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send payout email to ${data.resellerEmail}`, error);
    }
  }

  async sendResellerCommissionVoided(data: ResellerCommissionVoidedData): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM', 'noreply@shopvui.com'),
        to: data.resellerEmail,
        subject: `Commission voided for order #${data.orderNumber}`,
        html: `
          <h2>Hi ${data.resellerName},</h2>
          <p>The commission for order #${data.orderNumber} has been voided.</p>
          <p><strong>Reason:</strong> ${data.voidReason}</p>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send void email to ${data.resellerEmail}`, error);
    }
  }
}
