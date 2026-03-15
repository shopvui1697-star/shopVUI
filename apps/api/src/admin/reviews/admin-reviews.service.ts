import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminReviewsService {
  async findAll(query: {
    status?: string;
    productId?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductReviewWhereInput = {};
    if (query.status) where.status = query.status as any;
    if (query.productId) where.productId = query.productId;
    if (query.userId) where.userId = query.userId;

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          product: { select: { name: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.productReview.count({ where }),
    ]);

    return {
      data: reviews.map((r) => ({
        id: r.id,
        userName: r.user.name ?? 'Anonymous',
        userEmail: r.user.email,
        productName: r.product.name,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async approve(id: string) {
    const review = await prisma.productReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.productReview.update({
        where: { id },
        data: { status: 'APPROVED' },
        include: {
          product: { select: { name: true } },
          user: { select: { name: true, email: true } },
        },
      });

      await this.recalcProductAggregates(review.productId, tx);

      return updated;
    });

    return {
      id: result.id,
      userName: result.user.name ?? 'Anonymous',
      userEmail: result.user.email,
      productName: result.product.name,
      productId: result.productId,
      rating: result.rating,
      comment: result.comment,
      status: result.status,
      helpfulCount: result.helpfulCount,
      createdAt: result.createdAt.toISOString(),
    };
  }

  async reject(id: string) {
    const review = await prisma.productReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const wasApproved = review.status === 'APPROVED';

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.productReview.update({
        where: { id },
        data: { status: 'REJECTED' },
        include: {
          product: { select: { name: true } },
          user: { select: { name: true, email: true } },
        },
      });

      if (wasApproved) {
        await this.recalcProductAggregates(review.productId, tx);
      }

      return updated;
    });

    return {
      id: result.id,
      userName: result.user.name ?? 'Anonymous',
      userEmail: result.user.email,
      productName: result.product.name,
      productId: result.productId,
      rating: result.rating,
      comment: result.comment,
      status: result.status,
      helpfulCount: result.helpfulCount,
      createdAt: result.createdAt.toISOString(),
    };
  }

  async remove(id: string) {
    const review = await prisma.productReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    await prisma.$transaction(async (tx) => {
      await tx.reviewVote.deleteMany({ where: { reviewId: id } });
      await tx.productReview.delete({ where: { id } });
      await this.recalcProductAggregates(review.productId, tx);
    });

    return { success: true };
  }

  private async recalcProductAggregates(productId: string, tx: Prisma.TransactionClient) {
    const result = await tx.productReview.aggregate({
      where: { productId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        avgRating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : null,
        reviewCount: result._count,
      },
    });
  }
}
