import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { toggleVote } from '../lib/api/reviews';
import type { PaginatedReviews } from '../lib/api/reviews';

export function useToggleVote(productId: string, page: number) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['reviews', productId, page];

  return useMutation({
    mutationFn: (reviewId: string) => toggleVote(reviewId, token!),
    onMutate: async (reviewId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PaginatedReviews>(queryKey);

      queryClient.setQueryData<PaginatedReviews>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  userHasVoted: !review.userHasVoted,
                  helpfulCount: review.userHasVoted
                    ? review.helpfulCount - 1
                    : review.helpfulCount + 1,
                }
              : review,
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _reviewId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
