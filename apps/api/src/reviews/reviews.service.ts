import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@shopvui/db';
import { Prisma } from '@prisma/client';
import type { ReviewVoteResponse, ReviewSummary } from '@shopvui/shared';

@Injectable()
export class ReviewsService {
  async create(userId: string, dto: { productId: string; rating: number; comment: string }) {
    const hasPurchased = await this.verifyPurchase(userId, dto.productId);
    if (!hasPurchased) {
      throw new ForbiddenException('Purchase verification failed');
    }

    const sanitizedComment = this.stripHtml(dto.comment);

    try {
      const review = await prisma.productReview.create({
        data: {
          userId,
          productId: dto.productId,
          rating: dto.rating,
          comment: sanitizedComment,
          status: 'PENDING',
        },
        include: {
          user: { select: { name: true, avatar: true } },
        },
      });

      return {
        id: review.id,
        userId: review.userId,
        userName: review.user.name ?? 'Anonymous',
        userAvatar: review.user.avatar,
        productId: review.productId,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        helpfulCount: review.helpfulCount,
        userHasVoted: false,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Review already exists');
      }
      throw error;
    }
  }

  async findAll(query: { productId?: string; page?: number; pageSize?: number; sortBy?: string }, userId?: string) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy ?? 'createdAt';

    const where: Prisma.ProductReviewWhereInput = {
      status: 'APPROVED',
      ...(query.productId && { productId: query.productId }),
    };

    const orderBy: Prisma.ProductReviewOrderByWithRelationInput =
      sortBy === 'helpfulCount'
        ? { helpfulCount: 'desc' }
        : sortBy === 'rating'
          ? { rating: 'desc' }
          : { createdAt: 'desc' };

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          user: { select: { name: true, avatar: true } },
          ...(userId ? { votes: { where: { userId }, select: { id: true } } } : {}),
        },
      }),
      prisma.productReview.count({ where }),
    ]);

    return {
      data: reviews.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        userName: r.user.name ?? 'Anonymous',
        userAvatar: r.user.avatar,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        helpfulCount: r.helpfulCount,
        userHasVoted: userId ? (r.votes?.length ?? 0) > 0 : false,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async update(id: string, userId: string, dto: { rating?: number; comment?: string }) {
    const review = await prisma.productReview.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own review');
    }

    const data: Prisma.ProductReviewUpdateInput = { status: 'PENDING' };
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.comment !== undefined) data.comment = this.stripHtml(dto.comment);

    const updated = await prisma.productReview.update({
      where: { id },
      data,
      include: {
        user: { select: { name: true, avatar: true } },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      userName: updated.user.name ?? 'Anonymous',
      userAvatar: updated.user.avatar,
      productId: updated.productId,
      rating: updated.rating,
      comment: updated.comment,
      status: updated.status,
      helpfulCount: updated.helpfulCount,
      userHasVoted: false,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async remove(id: string, userId: string) {
    const review = await prisma.productReview.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own review');
    }

    await prisma.productReview.delete({ where: { id } });

    // Recalculate product aggregates if review was approved
    if (review.status === 'APPROVED') {
      await this.recalcProductAggregates(review.productId);
    }

    return { success: true };
  }

  async getSummary(productId: string): Promise<ReviewSummary> {
    const grouped = await prisma.productReview.groupBy({
      by: ['rating'],
      where: { productId, status: 'APPROVED' },
      _count: true,
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    let totalRating = 0;
    let reviewCount = 0;

    for (const group of grouped) {
      const rating = group.rating as 1 | 2 | 3 | 4 | 5;
      distribution[rating] = group._count;
      totalRating += rating * group._count;
      reviewCount += group._count;
    }

    return {
      avgRating: reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : null,
      reviewCount,
      distribution,
    };
  }

  async toggleVote(reviewId: string, userId: string): Promise<ReviewVoteResponse> {
    const review = await prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.status !== 'APPROVED') {
      throw new BadRequestException('Can only vote on approved reviews');
    }
    if (review.userId === userId) {
      throw new ForbiddenException('Cannot vote on own review');
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.reviewVote.findUnique({
        where: { userId_reviewId: { userId, reviewId } },
      });

      if (existingVote) {
        await tx.reviewVote.delete({ where: { id: existingVote.id } });
        const updated = await tx.productReview.update({
          where: { id: reviewId },
          data: { helpfulCount: { decrement: 1 } },
        });
        return { voted: false, helpfulCount: updated.helpfulCount };
      } else {
        await tx.reviewVote.create({ data: { userId, reviewId } });
        const updated = await tx.productReview.update({
          where: { id: reviewId },
          data: { helpfulCount: { increment: 1 } },
        });
        return { voted: true, helpfulCount: updated.helpfulCount };
      }
    });

    return result;
  }

  async canReview(userId: string, productId: string): Promise<{ canReview: boolean; reason?: string }> {
    const existing = await prisma.productReview.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      return { canReview: false, reason: 'already_reviewed' };
    }

    const hasPurchased = await this.verifyPurchase(userId, productId);
    if (!hasPurchased) {
      return { canReview: false, reason: 'no_purchase' };
    }

    return { canReview: true };
  }

  private async verifyPurchase(userId: string, productId: string): Promise<boolean> {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    });
    return !!orderItem;
  }

  private async recalcProductAggregates(productId: string) {
    const result = await prisma.productReview.aggregate({
      where: { productId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : null,
        reviewCount: result._count,
      },
    });
  }

  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }
}
