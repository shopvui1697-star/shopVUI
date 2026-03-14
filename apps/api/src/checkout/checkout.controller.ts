import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
@ApiTags('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('preview')
  @ApiOperation({ summary: 'Preview checkout totals' })
  async preview(@Req() req: any, @Body() body: { couponCode?: string }) {
    return this.checkoutService.preview(req.user.id, body.couponCode);
  }

  @Post('place-order')
  @ApiOperation({ summary: 'Place an order' })
  async placeOrder(
    @Req() req: any,
    @Body() body: { addressId: string; paymentMethod: 'VNPAY' | 'MOMO' | 'BANK_TRANSFER' | 'COD'; couponCode?: string },
  ) {
    return this.checkoutService.placeOrder(req.user.id, body);
  }
}
