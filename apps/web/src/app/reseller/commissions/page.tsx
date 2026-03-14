'use client';

import { useEffect, useState } from 'react';
import * as api from '@/lib/api';

const STATUSES = ['ALL', 'PENDING', 'MATURING', 'APPROVED', 'PAID', 'VOIDED'] as const;

interface Commission {
  id: string;
  orderNumber: string;
  couponCode: string;
  orderTotal: number;
  commissionAmount: number;
  status: string;
  maturityDate: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
}

export default function ResellerCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('reseller_token');
    if (!token) return;

    setLoading(true);
    api
      .getResellerCommissions(token, activeTab === 'ALL' ? undefined : activeTab)
      .then((data) => setCommissions(data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

  const daysRemaining = (maturityDate: string | null) => {
    if (!maturityDate) return null;
    const diff = Math.ceil((new Date(maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Commissions</h1>
      <div className="flex gap-2 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={`px-3 py-1 rounded text-sm ${activeTab === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : commissions.length === 0 ? (
        <p className="text-gray-500">No commissions found.</p>
      ) : (
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm">Order</th>
              <th className="px-4 py-3 text-right text-sm">Amount</th>
              <th className="px-4 py-3 text-left text-sm">Status</th>
              <th className="px-4 py-3 text-left text-sm">Info</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 text-sm">{c.orderNumber}</td>
                <td className="px-4 py-3 text-sm text-right">{c.commissionAmount.toLocaleString()} VND</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    c.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    c.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                    c.status === 'VOIDED' ? 'bg-red-100 text-red-800' :
                    c.status === 'MATURING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {c.status === 'MATURING' && c.maturityDate && (
                    <span>{daysRemaining(c.maturityDate)} days remaining</span>
                  )}
                  {c.status === 'PAID' && c.paidAt && (
                    <span>Paid {new Date(c.paidAt).toLocaleDateString()}</span>
                  )}
                  {c.status === 'VOIDED' && c.voidReason && (
                    <span>{c.voidReason}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
