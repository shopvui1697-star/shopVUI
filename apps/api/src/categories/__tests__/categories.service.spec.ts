import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@shopvui/db', () => {
  const mockPrisma = {
    category: {
      findMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from '@shopvui/db';
import { CategoriesService } from '../categories.service';

const mockPrisma = prisma as unknown as {
  category: {
    findMany: ReturnType<typeof vi.fn>;
  };
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoriesService();
  });

  describe('findAll', () => {
    it('should return categories array', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          parentId: null,
          children: [{ id: 'cat-2', name: 'Phones', slug: 'phones', parentId: 'cat-1' }],
          _count: { products: 5 },
        },
        {
          id: 'cat-3',
          name: 'Clothing',
          slug: 'clothing',
          parentId: null,
          children: [],
          _count: { products: 3 },
        },
      ];
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        include: {
          children: true,
          _count: { select: { products: true } },
        },
        where: { parentId: null },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no categories exist', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
