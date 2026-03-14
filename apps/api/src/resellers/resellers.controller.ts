import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ResellersService } from './resellers.service';
import { ResellerGuard } from './guards/reseller.guard';
import type { ProposeResellerCouponDto } from './dto/coupon.dto';

@Controller('resellers')
export class ResellersController {
  constructor(private readonly resellersService: ResellersService) {}

  @Get('me')
  @UseGuards(ResellerGuard)
  async getProfile(@Request() req: any) {
    return this.resellersService.findByUserId(req.user.sub);
  }

  @Put('me')
  @UseGuards(ResellerGuard)
  async updateProfile(@Request() req: any, @Body() body: { phone?: string; bankInfo?: any; socialProfiles?: any }) {
    return this.resellersService.updateProfile(req.user.sub, body);
  }

  @Get('me/dashboard')
  @UseGuards(ResellerGuard)
  async getDashboard(@Request() req: any) {
    return this.resellersService.getDashboardStats(req.reseller.id);
  }

  @Post('me/coupons')
  @UseGuards(ResellerGuard)
  async proposeCoupon(@Request() req: any, @Body() dto: ProposeResellerCouponDto) {
    return this.resellersService.proposeCoupon(req.reseller.id, dto);
  }

  @Get('me/coupons')
  @UseGuards(ResellerGuard)
  async getCoupons(@Request() req: any) {
    return this.resellersService.getResellerCoupons(req.reseller.id);
  }
}
