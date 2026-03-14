import { Controller, Post, Get, Query, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
@ApiTags('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('vnpay/ipn')
  @ApiOperation({ summary: 'VNPay IPN webhook' })
  async vnpayIpn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVnpayIpn(query);
  }

  @Post('momo/ipn')
  @ApiOperation({ summary: 'Momo IPN webhook' })
  async momoIpn(@Body() body: Record<string, any>) {
    return this.paymentsService.handleMomoIpn(body);
  }

  @Get('vnpay/return')
  @ApiOperation({ summary: 'VNPay return URL (redirect back)' })
  async vnpayReturn(@Query() query: Record<string, string>, @Res() res: Response) {
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const orderRef = query['vnp_TxnRef'] || '';
    res.redirect(`${webUrl}/checkout/result?ref=${orderRef}`);
  }

  @Get('momo/return')
  @ApiOperation({ summary: 'Momo return URL (redirect back)' })
  async momoReturn(@Query() query: Record<string, string>, @Res() res: Response) {
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    const orderRef = query['orderId'] || '';
    res.redirect(`${webUrl}/checkout/result?ref=${orderRef}`);
  }
}
