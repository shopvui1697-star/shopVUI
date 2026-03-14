'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('reseller.orders');
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

  if (loading) return <div className="p-8 text-center">{t('loadingOrders')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      {orders.length === 0 ? (
        <p className="text-gray-500">{t('noOrders')}</p>
      ) : (
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm">{t('order')}</th>
              <th className="px-4 py-3 text-left text-sm">{t('date')}</th>
              <th className="px-4 py-3 text-right text-sm">{t('orderTotal')}</th>
              <th className="px-4 py-3 text-right text-sm">{t('commission')}</th>
              <th className="px-4 py-3 text-left text-sm">{t('status')}</th>
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
