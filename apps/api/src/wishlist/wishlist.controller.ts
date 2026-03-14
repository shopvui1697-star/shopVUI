import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  async toggle(@Req() req: any, @Param('productId') productId: string) {
    return this.wishlistService.toggle(req.user.id, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: any, @Param('productId') productId: string) {
    await this.wishlistService.remove(req.user.id, productId);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.wishlistService.findAll(req.user.id);
  }

  @Get('check/:productId')
  async check(@Req() req: any, @Param('productId') productId: string) {
    return this.wishlistService.check(req.user.id, productId);
  }
}
