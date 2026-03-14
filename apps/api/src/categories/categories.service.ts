import { Injectable } from '@nestjs/common';
import { prisma } from '@shopvui/db';

@Injectable()
export class CategoriesService {
  async findAll() {
    return prisma.category.findMany({
      include: {
        children: true,
        _count: { select: { products: true } },
      },
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });
  }
}
