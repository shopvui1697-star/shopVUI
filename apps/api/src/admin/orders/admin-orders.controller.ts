import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard } from '../guards/admin.guard';
import { AdminOrdersService } from './admin-orders.service';
import type { UpdateOrderStatusDto, BulkOrderActionDto } from './dto/admin-order-filters.dto';

@Controller('admin/orders')
@UseGuards(AdminGuard)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  async findAll(
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminOrdersService.findAll({
      channel,
      status,
      dateFrom,
      dateTo,
      paymentStatus,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('invoices')
  async invoices(@Query('ids') ids: string, @Res() res: Response) {
    if (!ids || !ids.trim()) {
      throw new BadRequestException('No order IDs provided');
    }
    const orderIds = ids.split(',').map((id) => id.trim()).filter(Boolean);
    const html = await this.adminOrdersService.renderInvoices(orderIds);
    res.type('text/html').send(html);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminOrdersService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.adminOrdersService.updateStatus(id, body.status, body.note);
  }

  @Post('bulk')
  async bulkAction(@Body() body: BulkOrderActionDto) {
    return this.adminOrdersService.bulkAction(body.orderIds, body.action);
  }
}
