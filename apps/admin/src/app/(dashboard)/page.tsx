'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeCoupons: number;
  activeResellers: number;
  pendingOrders: number;
  pendingResellers: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  channel: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          apiFetch<DashboardStats>('/admin/dashboard/stats'),
          apiFetch<{ orders: RecentOrder[] }>('/admin/orders?page=1&pageSize=10'),
        ]);
        setStats(statsRes);
        setRecentOrders(ordersRes.orders);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading dashboard...</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Orders" value={stats.totalOrders.toLocaleString()} href="/orders" />
          <StatCard
            label="Total Revenue"
            value={`${stats.totalRevenue.toLocaleString()}d`}
            href="/analytics"
          />
          <StatCard label="Active Coupons" value={String(stats.activeCoupons)} href="/coupons" />
          <StatCard label="Active Resellers" value={String(stats.activeResellers)} href="/resellers" />
        </div>
      )}

      {/* Action Items */}
      {stats && (stats.pendingOrders > 0 || stats.pendingResellers > 0) && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-yellow-800">Needs Attention</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            {stats.pendingOrders > 0 && (
              <Link href="/orders?status=PENDING" className="text-yellow-700 hover:underline">
                {stats.pendingOrders} pending order{stats.pendingOrders > 1 ? 's' : ''}
              </Link>
            )}
            {stats.pendingResellers > 0 && (
              <Link href="/resellers?status=PENDING" className="text-yellow-700 hover:underline">
                {stats.pendingResellers} pending reseller application{stats.pendingResellers > 1 ? 's' : ''}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-medium">Recent Orders</h3>
          <Link href="/orders" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Order #</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Channel</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Total</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No orders yet
                </td>
              </tr>
            ) : (
              recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/orders/${o.id}`} className="text-blue-600 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{o.customerName || o.customerEmail || '-'}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{o.channel}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        o.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-800'
                          : o.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : o.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{o.total.toLocaleString()}d</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="block rounded-lg border bg-white p-4 transition-shadow hover:shadow-md">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Link>
  );
}
