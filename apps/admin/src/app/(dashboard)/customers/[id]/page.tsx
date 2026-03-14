'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { StatusBadge, ChannelBadge } from '@/components/status-badge';
import type { AdminCustomerDetail } from '@shopvui/shared';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminCustomerDetail>(`/admin/customers/${params.id}`)
      .then(setCustomer)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!customer) return <p className="text-sm text-red-500">Customer not found</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{customer.name || customer.email}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Orders</p>
          <p className="text-xl font-semibold">{customer.orderCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Total Spend</p>
          <p className="text-xl font-semibold">{customer.totalSpend.toLocaleString()}d</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Email</p>
          <p className="text-sm">{customer.email}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Member Since</p>
          <p className="text-sm">{new Date(customer.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-medium">Purchase History</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">Order</th>
              <th className="pb-2">Channel</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {customer.orders.map((o) => (
              <tr key={o.orderNumber} className="border-b last:border-0">
                <td className="py-2">{o.orderNumber}</td>
                <td className="py-2"><ChannelBadge channel={o.channel} /></td>
                <td className="py-2"><StatusBadge status={o.status} /></td>
                <td className="py-2">{o.total.toLocaleString()}d</td>
                <td className="py-2">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {customer.orders.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-gray-400">No orders</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
