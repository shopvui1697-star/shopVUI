import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PriceTiersService } from './price-tiers.service';

@Controller()
@ApiTags('price-tiers')
export class PriceTiersController {
  constructor(private readonly priceTiersService: PriceTiersService) {}

  @Get('products/:productId/price-tiers')
  @ApiOperation({ summary: 'List price tiers for a product' })
  async findByProduct(@Param('productId') productId: string) {
    return this.priceTiersService.findByProduct(productId);
  }

  @Post('products/:productId/price-tiers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a price tier' })
  async create(
    @Param('productId') productId: string,
    @Body() body: { minQty: number; maxQty?: number; price: number },
  ) {
    return this.priceTiersService.create(productId, body);
  }

  @Patch('price-tiers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a price tier' })
  async update(
    @Param('id') id: string,
    @Body() body: { minQty?: number; maxQty?: number; price?: number },
  ) {
    return this.priceTiersService.update(id, body);
  }

  @Delete('price-tiers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a price tier' })
  async delete(@Param('id') id: string) {
    return this.priceTiersService.delete(id);
  }
}
