'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useReviews, useReviewSummary, useCanReview } from '../../hooks/useReviews';
import { ReviewSummary } from './ReviewSummary';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';

interface ReviewSectionProps {
  productId: string;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews(productId, page);
  const { data: summaryData } = useReviewSummary(productId);
  const { data: canReviewData } = useCanReview(productId);

  const reviews = reviewsData?.data ?? [];
  const totalPages = reviewsData?.totalPages ?? 1;
  const showForm = !!user && canReviewData?.canReview === true;

  return (
    <div className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
        Customer Reviews
      </h2>

      <ReviewSummary summary={summaryData ?? null} />

      <div className="mt-8">
        {showForm && (
          <div className="mb-8 rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
            <ReviewForm productId={productId} />
          </div>
        )}

        {reviewsLoading ? (
          <p className="py-8 text-center text-sm text-neutral-500">Loading reviews...</p>
        ) : (
          <ReviewList
            reviews={reviews}
            productId={productId}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
