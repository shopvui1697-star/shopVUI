import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shopvui/db', () => {
  const mockPrisma = {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@shopvui/db';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products.service';

const mockPrisma = prisma as unknown as {
  product: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
};

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    price: 1999,
    compareAtPrice: null,
    stockQuantity: 10,
    isActive: true,
    categoryId: 'cat-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [{ id: 'img-1', url: 'https://example.com/img.jpg', alt: 'Test', sortOrder: 0 }],
    category: { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProductsService();
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 12 });

      expect(result).toEqual({
        data: [mockProduct],
        total: 1,
        page: 1,
        pageSize: 12,
        totalPages: 1,
      });
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          skip: 0,
          take: 12,
        }),
      );
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });

    it('should filter by search with OR containing name and description', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await service.findAll({ search: 'test' });

      const expectedWhere = {
        isActive: true,
        OR: [
          { name: { contains: 'test', mode: 'insensitive' } },
          { description: { contains: 'test', mode: 'insensitive' } },
        ],
      };
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
      expect(mockPrisma.product.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });

    it('should filter by categoryId', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);
      mockPrisma.product.count.mockResolvedValue(1);

      await service.findAll({ categoryId: 'cat-1' });

      const expectedWhere = { isActive: true, categoryId: 'cat-1' };
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
    });

    it('should return empty data array with totalPages 0 when no results', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
      });
    });
  });

  describe('findOne', () => {
    it('should return product with images and category', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-1');

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          category: true,
          priceTiers: { orderBy: { minQty: 'asc' } },
        },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Product with id "nonexistent" not found',
      );
    });
  });
});
