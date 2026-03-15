'use client';

import type { ReviewResponse } from '@shopvui/shared';
import { ReviewCard } from './ReviewCard';

interface ReviewListProps {
  reviews: ReviewResponse[];
  productId: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ReviewList({ reviews, productId, page, totalPages, onPageChange }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        No reviews yet
      </p>
    );
  }

  return (
    <div>
      <div>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} productId={productId} page={page} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
