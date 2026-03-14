import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';

@Controller('cart')
@ApiTags('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart with calculated prices' })
  async getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(@Req() req: any, @Body() body: { productId: string; quantity: number }) {
    return this.cartService.addItem(req.user.id, body.productId, body.quantity);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateItemQuantity(req.user.id, id, body.quantity);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@Req() req: any, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.id, id);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge guest cart into user cart' })
  async merge(@Req() req: any, @Body() body: { items: Array<{ productId: string; quantity: number }> }) {
    return this.cartService.mergeGuestCart(req.user.id, body.items);
  }
}
