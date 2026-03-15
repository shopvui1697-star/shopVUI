import { apiFetch } from '../api';
import type { AdminReviewListItem, ReviewStatus } from '@shopvui/shared';

export interface AdminReviewFilters {
  status?: ReviewStatus | 'ALL';
  productId?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAdminReviews {
  data: AdminReviewListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getAdminReviews(
  filters: AdminReviewFilters = {},
): Promise<PaginatedAdminReviews> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.productId) params.set('productId', filters.productId);
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  const qs = params.toString();
  return apiFetch<PaginatedAdminReviews>(`/admin/reviews${qs ? `?${qs}` : ''}`);
}

export async function approveReview(id: string): Promise<void> {
  await apiFetch(`/admin/reviews/${id}/approve`, { method: 'PATCH' });
}

export async function rejectReview(id: string): Promise<void> {
  await apiFetch(`/admin/reviews/${id}/reject`, { method: 'PATCH' });
}

export async function deleteAdminReview(id: string): Promise<void> {
  await apiFetch(`/admin/reviews/${id}`, { method: 'DELETE' });
}
