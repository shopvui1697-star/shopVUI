import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getReviews, createReview, getReviewSummary, checkCanReview } from '../lib/api/reviews';
import type { CreateReviewDto } from '@shopvui/shared';

export function useReviews(productId: string, page = 1) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: () => getReviews(productId, page, 10, token),
    enabled: !!productId,
  });
}

export function useReviewSummary(productId: string) {
  return useQuery({
    queryKey: ['review-summary', productId],
    queryFn: () => getReviewSummary(productId),
    enabled: !!productId,
  });
}

export function useCanReview(productId: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['can-review', productId],
    queryFn: () => checkCanReview(productId, token!),
    enabled: !!productId && !!token,
  });
}

export function useCreateReview() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateReviewDto) => createReview(dto, token!),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['review-summary', variables.productId] });
    },
  });
}
