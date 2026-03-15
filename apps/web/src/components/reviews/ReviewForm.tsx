'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import { useCreateReview } from '../../hooks/useReviews';

interface ReviewFormProps {
  productId: string;
}

export function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { mutate, isPending } = useCreateReview();

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          Review pending moderation
        </p>
        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
          Your review has been submitted and will appear after approval.
        </p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');

    if (rating === 0) {
      setValidationError('Please select a star rating.');
      return;
    }

    if (comment.length < 10) {
      setValidationError('Comment must be at least 10 characters.');
      return;
    }

    if (comment.length > 1000) {
      setValidationError('Comment must be 1000 characters or less.');
      return;
    }

    mutate(
      { productId, rating, comment },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err) => setValidationError(err.message),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
        Write a Review
      </h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Rating
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your experience with this product..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {comment.length}/1000 characters (minimum 10)
        </p>
      </div>

      {validationError && (
        <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
