import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminCouponsService } from './admin-coupons.service';
import type { CreateCouponDto, UpdateCouponDto, ApproveCouponDto } from './dto/admin-coupon.dto';

@Controller('admin/coupons')
@UseGuards(AdminGuard)
export class AdminCouponsController {
  constructor(private readonly adminCouponsService: AdminCouponsService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.adminCouponsService.findAll(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminCouponsService.findOne(id);
  }

  @Post()
  async create(@Body() body: CreateCouponDto) {
    return this.adminCouponsService.create(body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCouponDto) {
    return this.adminCouponsService.update(id, body);
  }

  @Patch(':id/toggle')
  async toggleActive(@Param('id') id: string) {
    return this.adminCouponsService.toggleActive(id);
  }

  @Patch(':id/approve')
  async approveResellerCoupon(@Param('id') id: string, @Body() body: ApproveCouponDto) {
    return this.adminCouponsService.approveResellerCoupon(id, body.approved);
  }
}
