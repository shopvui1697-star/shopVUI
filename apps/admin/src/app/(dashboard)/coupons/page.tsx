'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { DataTable, type Column } from '@/components/data-table';
import type { AdminCouponListItem, AdminCouponForm } from '@shopvui/shared';

interface CouponsResponse {
  coupons: AdminCouponListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const EMPTY_FORM: AdminCouponForm = {
  code: '',
  type: 'PERCENTAGE',
  value: undefined,
  minPurchase: undefined,
  usageLimit: undefined,
  validUntil: undefined,
};

export default function CouponsPage() {
  const [data, setData] = useState<CouponsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AdminCouponForm>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<CouponsResponse>(`/admin/coupons?page=${page}&pageSize=20`);
      setData(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    try {
      await apiFetch('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      fetchCoupons();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create coupon');
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await apiFetch(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchCoupons();
  }

  async function handleApprove(id: string) {
    await apiFetch(`/admin/coupons/${id}/approve`, { method: 'POST' });
    fetchCoupons();
  }

  async function handleReject(id: string) {
    await apiFetch(`/admin/coupons/${id}/reject`, { method: 'POST' });
    fetchCoupons();
  }

  const columns: Column<AdminCouponListItem>[] = [
    { key: 'code', header: 'Code', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'type', header: 'Type' },
    { key: 'value', header: 'Value', render: (r) => r.value != null ? String(r.value) : '-' },
    { key: 'timesUsed', header: 'Used' },
    {
      key: 'isActive',
      header: 'Active',
      render: (r) => (
        <button
          onClick={() => toggleActive(r.id, r.isActive)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${r.isActive ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
        </button>
      ),
    },
    {
      key: 'reseller',
      header: 'Reseller',
      render: (r) => r.isResellerCoupon ? r.resellerName || 'Reseller' : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.isResellerCoupon && !r.isActive ? (
          <div className="flex gap-2">
            <button onClick={() => handleApprove(r.id)} className="text-xs text-green-600 hover:underline">Approve</button>
            <button onClick={() => handleReject(r.id)} className="text-xs text-red-600 hover:underline">Reject</button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Coupons</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create Coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="max-w-lg space-y-3 rounded-lg border bg-white p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Code</label>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
                <option value="BUY_X_GET_Y">Buy X Get Y</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Value</label>
              <input type="number" min="0" value={form.value ?? ''} onChange={(e) => setForm({ ...form, value: e.target.value ? Number(e.target.value) : undefined })} className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Min Purchase</label>
              <input type="number" min="0" value={form.minPurchase ?? ''} onChange={(e) => setForm({ ...form, minPurchase: e.target.value ? Number(e.target.value) : undefined })} className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Max Uses</label>
              <input type="number" min="0" value={form.usageLimit ?? ''} onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? Number(e.target.value) : undefined })} className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Expires</label>
              <input type="date" value={form.validUntil ?? ''} onChange={(e) => setForm({ ...form, validUntil: e.target.value || undefined })} className="mt-1 block w-full rounded-md border px-3 py-1.5 text-sm" />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button type="submit" className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">Save</button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data?.coupons ?? []}
          page={page}
          totalPages={data ? Math.ceil(data.total / data.pageSize) : 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
