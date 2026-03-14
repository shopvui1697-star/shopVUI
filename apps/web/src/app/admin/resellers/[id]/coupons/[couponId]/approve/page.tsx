'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function ApproveCouponPage() {
  const { id, couponId } = useParams<{ id: string; couponId: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    type: 'PERCENTAGE',
    value: 10,
    commissionType: 'PERCENTAGE',
    commissionValue: 5,
    commissionBase: 'FINAL_TOTAL',
    maturityDays: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/admin/resellers/${id}/coupons/${couponId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to approve coupon');
      }
      router.push(`/admin/resellers/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Approve Reseller Coupon</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Discount Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded px-3 py-2">
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Discount Value</label>
          <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Commission Type</label>
          <select value={form.commissionType} onChange={(e) => setForm({ ...form, commissionType: e.target.value })} className="w-full border rounded px-3 py-2">
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed Amount</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Commission Value</label>
          <input type="number" value={form.commissionValue} onChange={(e) => setForm({ ...form, commissionValue: Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Commission Base</label>
          <select value={form.commissionBase} onChange={(e) => setForm({ ...form, commissionBase: e.target.value })} className="w-full border rounded px-3 py-2">
            <option value="FINAL_TOTAL">Final Total (after discount)</option>
            <option value="SUBTOTAL">Subtotal (before discount)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Maturity Days</label>
          <input type="number" value={form.maturityDays} onChange={(e) => setForm({ ...form, maturityDays: Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Approving...' : 'Approve Coupon'}
        </button>
      </form>
    </div>
  );
}
