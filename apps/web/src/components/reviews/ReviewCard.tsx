'use client';

import type { ReviewResponse } from '@shopvui/shared';
import { StarRating } from './StarRating';
import { HelpfulButton } from './HelpfulButton';

interface ReviewCardProps {
  review: ReviewResponse;
  productId: string;
  page: number;
}

export function ReviewCard({ review, productId, page }: ReviewCardProps) {
  return (
    <div className="border-b border-neutral-200 py-4 last:border-b-0 dark:border-neutral-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StarRating value={review.rating} readonly size="sm" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {review.userName}
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            {review.comment}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <time className="text-xs text-neutral-500 dark:text-neutral-400">
              {new Date(review.createdAt).toLocaleDateString()}
            </time>
            <HelpfulButton
              reviewId={review.id}
              helpfulCount={review.helpfulCount}
              userHasVoted={review.userHasVoted}
              productId={productId}
              page={page}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
