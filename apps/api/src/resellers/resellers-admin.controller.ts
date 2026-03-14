import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ResellersService } from './resellers.service';
import { AdminGuard } from './guards/admin.guard';
import type { ApproveResellerCouponDto } from './dto/coupon.dto';

@Controller('admin/resellers')
@UseGuards(AdminGuard)
export class ResellersAdminController {
  constructor(private readonly resellersService: ResellersService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.resellersService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      status,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.resellersService.findById(id);
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string) {
    return this.resellersService.approve(id);
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string) {
    return this.resellersService.reject(id);
  }

  @Put(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.resellersService.deactivate(id);
  }

  @Put(':id/coupons/:couponId/approve')
  async approveCoupon(@Param('couponId') couponId: string, @Body() dto: ApproveResellerCouponDto) {
    return this.resellersService.approveCoupon(couponId, dto);
  }
}
