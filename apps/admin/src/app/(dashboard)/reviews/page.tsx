'use client';

import { useState } from 'react';
import type { ReviewStatus } from '@shopvui/shared';
import {
  useAdminReviews,
  useApproveReview,
  useRejectReview,
  useDeleteReview,
} from '@/hooks/useAdminReviews';

type StatusFilter = ReviewStatus | 'ALL';

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles: Record<ReviewStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useAdminReviews({ status: statusFilter, page, pageSize: 20 });
  const approveMutation = useApproveReview();
  const rejectMutation = useRejectReview();
  const deleteMutation = useDeleteReview();

  const reviews = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-gray-900">Reviews</h1>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16">
          <p className="text-sm text-gray-500">No reviews found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Comment</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {review.productName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {review.userName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StarDisplay rating={review.rating} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-sm text-gray-700">
                    {review.comment.length > 100
                      ? `${review.comment.slice(0, 100)}...`
                      : review.comment}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={review.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      {review.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(review.id)}
                            disabled={approveMutation.isPending}
                            className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(review.id)}
                            disabled={rejectMutation.isPending}
                            className="rounded px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeleteConfirmId(review.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900">Delete Review</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
