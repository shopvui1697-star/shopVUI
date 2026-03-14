import { Controller, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CouponsService } from './coupons.service';

@Controller('coupons')
@ApiTags('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a coupon against current cart' })
  async validate(
    @Req() req: any,
    @Body() body: { code: string; cartItems: any[]; subtotal: number },
  ) {
    return this.couponsService.validate(body.code, req.user.id, body.cartItems, body.subtotal);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a coupon (admin)' })
  async create(@Body() body: any) {
    return this.couponsService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a coupon (admin)' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.couponsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a coupon (admin)' })
  async deactivate(@Param('id') id: string) {
    return this.couponsService.deactivate(id);
  }
}
