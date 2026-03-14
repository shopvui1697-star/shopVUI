'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import type { AdminPayoutListItem } from '@shopvui/shared';

interface PayoutsResponse {
  data: AdminPayoutListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function PayoutsPage() {
  const [data, setData] = useState<PayoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiFetch<PayoutsResponse>(`/admin/resellers/payouts?${params}`);
      setData(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  async function markPaid(id: string) {
    await apiFetch(`/admin/resellers/payouts/${id}/pay`, { method: 'POST' });
    fetchPayouts();
  }

  function exportCsv() {
    const token = localStorage.getItem('admin_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    window.open(`${apiUrl}/admin/resellers/payouts/export?token=${token}`, '_blank');
  }

  const columns: Column<AdminPayoutListItem>[] = [
    { key: 'resellerName', header: 'Reseller' },
    { key: 'orderNumber', header: 'Order' },
    { key: 'couponCode', header: 'Coupon', render: (r) => <span className="font-mono text-xs">{r.couponCode}</span> },
    { key: 'commissionAmount', header: 'Amount', render: (r) => `${r.commissionAmount.toLocaleString()}d` },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.status === 'APPROVED' ? (
          <button onClick={() => markPaid(r.id)} className="text-xs text-green-600 hover:underline">Mark Paid</button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Payouts</h2>
        <button onClick={exportCsv} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100">Export CSV</button>
      </div>
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
        </select>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          page={page}
          totalPages={data ? Math.ceil(data.total / data.pageSize) : 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
