'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ResellerOrder {
  orderNumber: string;
  createdAt: string;
  orderTotal: number;
  status: string;
  commissionAmount: number;
  commissionStatus: string;
}

export default function ResellerOrdersPage() {
  const [orders, setOrders] = useState<ResellerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('reseller_token');
    if (!token) return;

    fetch(`${API_URL}/resellers/me/commissions?pageSize=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOrders(data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders linked to your coupon yet.</p>
      ) : (
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm">Order</th>
              <th className="px-4 py-3 text-left text-sm">Date</th>
              <th className="px-4 py-3 text-right text-sm">Order Total</th>
              <th className="px-4 py-3 text-right text-sm">Commission</th>
              <th className="px-4 py-3 text-left text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderNumber} className="border-t">
                <td className="px-4 py-3 text-sm">{o.orderNumber}</td>
                <td className="px-4 py-3 text-sm">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-right">{o.orderTotal?.toLocaleString()} VND</td>
                <td className="px-4 py-3 text-sm text-right">{o.commissionAmount?.toLocaleString()} VND</td>
                <td className="px-4 py-3 text-sm">{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
