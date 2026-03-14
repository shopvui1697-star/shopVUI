'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import type { AdminResellerListItem } from '@shopvui/shared';

interface ResellersResponse {
  resellers: AdminResellerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function ResellersPage() {
  const [data, setData] = useState<ResellersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchResellers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ResellersResponse>(`/admin/resellers?page=${page}&pageSize=20`);
      setData(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchResellers();
  }, [fetchResellers]);

  async function handleAction(id: string, action: string) {
    await apiFetch(`/admin/resellers/${id}/${action}`, { method: 'POST' });
    fetchResellers();
  }

  async function updateCommission(id: string, rate: string) {
    const value = parseFloat(rate);
    if (isNaN(value)) return;
    await apiFetch(`/admin/resellers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ commissionRate: value }),
    });
  }

  const columns: Column<AdminResellerListItem>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'orderCount', header: 'Orders' },
    { key: 'totalRevenue', header: 'Revenue', render: (r) => `${r.totalRevenue.toLocaleString()}d` },
    {
      key: 'commissionRate',
      header: 'Commission %',
      render: (r) => (
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          defaultValue={r.commissionRate ?? ''}
          onBlur={(e) => updateCommission(r.id, e.target.value)}
          className="w-20 rounded border px-2 py-1 text-xs"
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-2">
          {r.status === 'PENDING' && (
            <>
              <button onClick={() => handleAction(r.id, 'approve')} className="text-xs text-green-600 hover:underline">Approve</button>
              <button onClick={() => handleAction(r.id, 'reject')} className="text-xs text-red-600 hover:underline">Reject</button>
            </>
          )}
          {r.status === 'ACTIVE' && (
            <button onClick={() => handleAction(r.id, 'suspend')} className="text-xs text-yellow-600 hover:underline">Suspend</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Resellers</h2>
        <a href="/resellers/payouts" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100">View Payouts</a>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data?.resellers ?? []}
          page={page}
          totalPages={data ? Math.ceil(data.total / data.pageSize) : 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
