'use client';

import type { ReviewSummary as ReviewSummaryType } from '@shopvui/shared';
import { StarRating } from './StarRating';

interface ReviewSummaryProps {
  summary: ReviewSummaryType | null | undefined;
}

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  if (!summary || summary.reviewCount === 0) {
    return null;
  }

  const stars = [5, 4, 3, 2, 1] as const;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
      <div className="flex flex-col items-center gap-1">
        <span className="text-4xl font-bold text-neutral-900 dark:text-white">
          {summary.avgRating!.toFixed(1)}
        </span>
        <StarRating value={summary.avgRating!} readonly size="md" />
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {summary.reviewCount} {summary.reviewCount === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        {stars.map((star) => {
          const count = summary.distribution[star] ?? 0;
          const pct = summary.reviewCount > 0 ? (count / summary.reviewCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-14 text-right text-neutral-600 dark:text-neutral-400">
                {star} stars
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-neutral-500 dark:text-neutral-400">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
