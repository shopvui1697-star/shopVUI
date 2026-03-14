'use client';

import { useEffect, useState } from 'react';
import * as api from '@/lib/api';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  activeCoupons: number;
}

export default function ResellerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('reseller_token');
    if (!token) return;
    api.getResellerDashboard(token).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-center text-red-600">Failed to load dashboard</div>;

  const cards = [
    { label: 'Total Orders', value: stats.totalOrders.toLocaleString() },
    { label: 'Total Revenue', value: `${stats.totalRevenue.toLocaleString()} VND` },
    { label: 'Commission Earned', value: `${stats.totalCommissionEarned.toLocaleString()} VND` },
    { label: 'Commission Paid', value: `${stats.totalCommissionPaid.toLocaleString()} VND` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Commission</p>
          <p className="text-xl font-bold">{stats.pendingCommission.toLocaleString()} VND</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Coupons</p>
          <p className="text-xl font-bold">{stats.activeCoupons}</p>
        </div>
      </div>
    </div>
  );
}
