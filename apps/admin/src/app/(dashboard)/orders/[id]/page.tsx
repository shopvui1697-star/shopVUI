'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { StatusBadge, ChannelBadge } from '@/components/status-badge';
import { VALID_NEXT_STATUSES, type OrderStatus } from '@/lib/constants';
import type { AdminOrderDetail } from '@shopvui/shared';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminOrderDetail>(`/admin/orders/${params.id}`)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [params.id]);

  async function updateStatus(newStatus: string) {
    await apiFetch(`/admin/orders/${params.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await apiFetch<AdminOrderDetail>(`/admin/orders/${params.id}`);
    setOrder(updated);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!order) return <p className="text-sm text-red-500">Order not found</p>;

  const nextStatuses = VALID_NEXT_STATUSES[order.status as OrderStatus] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Order {order.orderNumber}</h2>
        <StatusBadge status={order.status} />
        <ChannelBadge channel={order.channel} />
      </div>

      {nextStatuses.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Update status:</span>
          {nextStatuses.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-medium">Customer</h3>
          <dl className="space-y-1 text-sm">
            <div><dt className="inline text-gray-500">Name: </dt><dd className="inline">{order.user?.name || order.customerName || '-'}</dd></div>
            <div><dt className="inline text-gray-500">Email: </dt><dd className="inline">{order.user?.email || order.customerEmail || '-'}</dd></div>
            <div><dt className="inline text-gray-500">Phone: </dt><dd className="inline">{order.customerPhone || '-'}</dd></div>
          </dl>
        </div>

        {/* Pricing */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-medium">Pricing</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>{order.subtotal?.toLocaleString()}d</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Shipping</dt><dd>{order.shippingFee?.toLocaleString()}d</dd></div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between"><dt className="text-gray-500">Discount ({order.couponCode})</dt><dd>-{order.discountAmount.toLocaleString()}d</dd></div>
            )}
            <div className="flex justify-between border-t pt-1 font-medium"><dt>Total</dt><dd>{order.total.toLocaleString()}d</dd></div>
          </dl>
        </div>

        {/* Attribution */}
        {(order.coupon || order.reseller) && (
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 font-medium">Attribution</h3>
            <dl className="space-y-1 text-sm">
              {order.coupon && <div><dt className="inline text-gray-500">Coupon: </dt><dd className="inline">{order.coupon.code} ({order.coupon.type})</dd></div>}
              {order.reseller && <div><dt className="inline text-gray-500">Reseller: </dt><dd className="inline">{order.reseller.name}</dd></div>}
            </dl>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-medium">Items</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">Product</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2">Unit Price</th>
              <th className="pb-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2">{item.productName}</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">{item.unitPrice.toLocaleString()}d</td>
                <td className="py-2">{item.subtotal.toLocaleString()}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status History */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-medium">Status History</h3>
        <div className="space-y-3">
          {order.statusHistory.map((entry, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium">{entry.status}</p>
                <p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</p>
                {entry.note && <p className="text-xs text-gray-400">{entry.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
