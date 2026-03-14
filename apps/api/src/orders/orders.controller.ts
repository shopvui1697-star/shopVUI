import { Controller, Get, Post, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
@ApiTags('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List user orders (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ordersService.findAll(
      req.user.id,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get order detail' })
  async findOne(@Req() req: any, @Param('orderNumber') orderNumber: string) {
    return this.ordersService.findOne(orderNumber, req.user.id);
  }

  @Post(':orderNumber/cancel')
  @ApiOperation({ summary: 'Cancel a pending order' })
  async cancel(@Req() req: any, @Param('orderNumber') orderNumber: string) {
    return this.ordersService.cancel(orderNumber, req.user.id);
  }
}
