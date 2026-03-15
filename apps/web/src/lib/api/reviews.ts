import type {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponse,
  ReviewVoteResponse,
  ReviewSummary,
} from '@shopvui/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export interface PaginatedReviews {
  data: ReviewResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getReviews(
  productId: string,
  page = 1,
  pageSize = 10,
  token?: string | null,
): Promise<PaginatedReviews> {
  const headers: HeadersInit = token ? authHeaders(token) : {};
  const res = await fetch(
    `${API_URL}/reviews?productId=${productId}&page=${page}&pageSize=${pageSize}`,
    { headers },
  );
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function createReview(
  dto: CreateReviewDto,
  token: string,
): Promise<ReviewResponse> {
  const res = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to create review');
  }
  return res.json();
}

export async function updateReview(
  id: string,
  dto: UpdateReviewDto,
  token: string,
): Promise<ReviewResponse> {
  const res = await fetch(`${API_URL}/reviews/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to update review');
  return res.json();
}

export async function deleteReview(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/reviews/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete review');
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
}

export async function checkCanReview(
  productId: string,
  token: string,
): Promise<CanReviewResponse> {
  const res = await fetch(`${API_URL}/reviews/can-review/${productId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return { canReview: false, reason: 'error' };
  return res.json();
}

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const res = await fetch(`${API_URL}/reviews/summary/${productId}`);
  if (!res.ok) throw new Error('Failed to fetch review summary');
  return res.json();
}

export async function toggleVote(
  reviewId: string,
  token: string,
): Promise<ReviewVoteResponse> {
  const res = await fetch(`${API_URL}/reviews/${reviewId}/vote`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to toggle vote');
  return res.json();
}
