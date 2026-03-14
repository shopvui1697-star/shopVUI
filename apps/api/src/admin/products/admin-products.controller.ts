import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../guards/admin.guard';
import { AdminProductsService } from './admin-products.service';
import type { CreateProductDto, UpdateProductDto } from './dto/admin-product.dto';
import type { CreatePriceTierDto, UpdatePriceTierDto } from './dto/price-tier.dto';

@Controller('admin/products')
@UseGuards(AdminGuard)
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminProductsService.findAll({
      search,
      categoryId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminProductsService.findOne(id);
  }

  @Post()
  async create(@Body() body: CreateProductDto) {
    return this.adminProductsService.create(body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.adminProductsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.adminProductsService.softDelete(id);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      cb(null, allowed.includes(file.mimetype));
    },
  }))
  async uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.adminProductsService.uploadImage(id, file);
  }

  @Get(':productId/price-tiers')
  async getPriceTiers(@Param('productId') productId: string) {
    return this.adminProductsService.getPriceTiers(productId);
  }

  @Post(':productId/price-tiers')
  async createPriceTier(
    @Param('productId') productId: string,
    @Body() body: CreatePriceTierDto,
  ) {
    return this.adminProductsService.createPriceTier(productId, body);
  }

  @Patch(':productId/price-tiers/:tierId')
  async updatePriceTier(
    @Param('productId') productId: string,
    @Param('tierId') tierId: string,
    @Body() body: UpdatePriceTierDto,
  ) {
    return this.adminProductsService.updatePriceTier(productId, tierId, body);
  }

  @Delete(':productId/price-tiers/:tierId')
  async deletePriceTier(
    @Param('productId') productId: string,
    @Param('tierId') tierId: string,
  ) {
    await this.adminProductsService.deletePriceTier(productId, tierId);
  }
}
