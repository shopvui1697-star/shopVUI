import { Injectable } from '@nestjs/common';
import { prisma } from '@shopvui/db';

@Injectable()
export class AdminCategoriesService {
  async findAll() {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { name: 'asc' },
    });

    return categories;
  }
}
