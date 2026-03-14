import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { STORAGE_ADAPTER, type IStorageAdapter } from '../storage/storage.interface';
import type { CreateProductDto, UpdateProductDto } from './dto/admin-product.dto';
import type { CreatePriceTierDto, UpdatePriceTierDto } from './dto/price-tier.dto';
import { rangesOverlap } from './price-tier-overlap.util';

@Injectable()
export class AdminProductsService {
  constructor(
    @Inject(STORAGE_ADAPTER) private readonly storage: IStorageAdapter,
  ) {}

  async findAll(filters: {
    search?: string;
    categoryId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(Math.max(1, filters.pageSize ?? 20), 100);
    const skip = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        stockQuantity: p.stockQuantity,
        categoryName: p.category.name,
        isActive: p.isActive,
        imageUrl: p.images[0]?.url ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        priceTiers: { orderBy: { minQty: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const sku = dto.sku ?? `SKU-${Date.now()}`;

    return prisma.product.create({
      data: {
        name: dto.name,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: dto.description,
        price: dto.basePrice,
        compareAtPrice: dto.compareAtPrice,
        sku,
        stockQuantity: dto.stockQuantity,
        categoryId: dto.categoryId,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.basePrice !== undefined) data.price = dto.basePrice;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.stockQuantity !== undefined) data.stockQuantity = dto.stockQuantity;
    if (dto.compareAtPrice !== undefined) data.compareAtPrice = dto.compareAtPrice;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return prisma.product.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async uploadImage(productId: string, file: Express.Multer.File) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const filename = `${productId}-${Date.now()}.${ext}`;
    const url = await this.storage.save(filename, file.buffer);

    const maxSort = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return prisma.productImage.create({
      data: {
        productId,
        url,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    });
  }

  async getPriceTiers(productId: string) {
    await this.ensureProductExists(productId);
    return prisma.priceTier.findMany({
      where: { productId },
      orderBy: { minQty: 'asc' },
    });
  }

  async createPriceTier(productId: string, dto: CreatePriceTierDto) {
    await this.ensureProductExists(productId);
    await this.checkOverlap(productId, dto.minQty, dto.maxQty ?? null);

    return prisma.priceTier.create({
      data: {
        productId,
        minQty: dto.minQty,
        maxQty: dto.maxQty ?? null,
        price: dto.price,
      },
    });
  }

  async updatePriceTier(productId: string, tierId: string, dto: UpdatePriceTierDto) {
    await this.ensureProductExists(productId);

    const tier = await prisma.priceTier.findFirst({
      where: { id: tierId, productId },
    });
    if (!tier) throw new NotFoundException('Price tier not found');

    const minQty = dto.minQty ?? tier.minQty;
    const maxQty = dto.maxQty !== undefined ? (dto.maxQty ?? null) : tier.maxQty;
    const price = dto.price ?? tier.price;

    await this.checkOverlap(productId, minQty, maxQty, tierId);

    return prisma.priceTier.update({
      where: { id: tierId },
      data: { minQty, maxQty, price },
    });
  }

  async deletePriceTier(productId: string, tierId: string) {
    const tier = await prisma.priceTier.findFirst({
      where: { id: tierId, productId },
    });
    if (!tier) throw new NotFoundException('Price tier not found');

    await prisma.priceTier.delete({ where: { id: tierId } });
  }

  private async ensureProductExists(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
  }

  private async checkOverlap(
    productId: string,
    minQty: number,
    maxQty: number | null,
    excludeTierId?: string,
  ) {
    const existingTiers = await prisma.priceTier.findMany({
      where: { productId },
    });

    for (const tier of existingTiers) {
      if (excludeTierId && tier.id === excludeTierId) continue;
      if (rangesOverlap(minQty, maxQty, tier.minQty, tier.maxQty)) {
        throw new BadRequestException(
          `Quantity range [${minQty}, ${maxQty ?? '∞'}] overlaps with existing tier [${tier.minQty}, ${tier.maxQty ?? '∞'}]`,
        );
      }
    }
  }
}
