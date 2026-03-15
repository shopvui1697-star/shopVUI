import { Module } from '@nestjs/common';
import { AdminReviewsService } from './admin-reviews.service';
import { AdminReviewsController } from './admin-reviews.controller';

@Module({
  providers: [AdminReviewsService],
  controllers: [AdminReviewsController],
})
export class AdminReviewsModule {}
