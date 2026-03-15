'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useToggleVote } from '../../hooks/useToggleVote';

interface HelpfulButtonProps {
  reviewId: string;
  helpfulCount: number;
  userHasVoted: boolean;
  productId: string;
  page: number;
  disabled?: boolean;
}

export function HelpfulButton({
  reviewId,
  helpfulCount,
  userHasVoted,
  productId,
  page,
  disabled,
}: HelpfulButtonProps) {
  const { token } = useAuth();
  const { mutate, isPending } = useToggleVote(productId, page);

  const isDisabled = disabled || !token || isPending;

  return (
    <button
      type="button"
      onClick={() => mutate(reviewId)}
      disabled={isDisabled}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
        userHasVoted
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
      } disabled:cursor-not-allowed disabled:opacity-50`}
      title={!token ? 'Log in to vote' : undefined}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 1 1-2.5 0v-7.5ZM7.5 6V2.5a2.5 2.5 0 0 1 5 0V6h2.086a1.5 1.5 0 0 1 1.473 1.786l-1.5 7.5A1.5 1.5 0 0 1 13.086 16.5H5.5a1 1 0 0 1-1-1V7.25a1 1 0 0 1 .293-.707L7.5 6Z" />
      </svg>
      Helpful ({helpfulCount})
    </button>
  );
}
