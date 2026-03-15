'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminReviews,
  approveReview,
  rejectReview,
  deleteAdminReview,
  type AdminReviewFilters,
} from '@/lib/api/reviews';

export function useAdminReviews(filters: AdminReviewFilters) {
  return useQuery({
    queryKey: ['admin-reviews', filters],
    queryFn: () => getAdminReviews(filters),
  });
}

export function useApproveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}

export function useRejectReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}
