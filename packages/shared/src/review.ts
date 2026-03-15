export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreateReviewDto {
  productId: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  productId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  helpfulCount: number;
  userHasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewVoteResponse {
  voted: boolean;
  helpfulCount: number;
}

export interface ReviewSummary {
  avgRating: number | null;
  reviewCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewListQuery {
  productId?: string;
  status?: ReviewStatus;
  page?: number;
  pageSize?: number;
  sortBy?: 'rating' | 'createdAt' | 'helpfulCount';
}

export interface AdminReviewListItem {
  id: string;
  userName: string;
  userEmail: string;
  productName: string;
  productId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  helpfulCount: number;
  createdAt: string;
}
