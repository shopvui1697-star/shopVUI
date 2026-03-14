'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { apiFetch } from '@/lib/api';
import { AovChart } from './aov-chart';
import { ResellerPerformance } from './reseller-performance';
import type {
  AnalyticsRevenueByChannel,
  AnalyticsRevenueOverTime,
  AnalyticsTopProducts,
  AnalyticsCouponPerformance,
} from '@shopvui/shared';

const PIE_COLORS = ['#3b82f6', '#f97316', '#ec4899', '#6366f1', '#6b7280'];

interface AnalyticsData {
  revenueByChannel: AnalyticsRevenueByChannel[];
  revenueOverTime: AnalyticsRevenueOverTime[];
  topProducts: AnalyticsTopProducts[];
  ordersByChannel: AnalyticsRevenueByChannel[];
  couponPerformance: AnalyticsCouponPerformance[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const qs = params.toString() ? `?${params}` : '';

      const [revenueByChannel, revenueOverTime, topProducts, couponPerformance] = await Promise.all([
        apiFetch<AnalyticsRevenueByChannel[]>(`/admin/analytics/revenue-by-channel${qs}`),
        apiFetch<AnalyticsRevenueOverTime[]>(`/admin/analytics/revenue-over-time${qs}`),
        apiFetch<AnalyticsTopProducts[]>(`/admin/analytics/top-products${qs}`),
        apiFetch<AnalyticsCouponPerformance[]>(`/admin/analytics/coupon-performance${qs}`),
      ]);
      setData({
        revenueByChannel,
        revenueOverTime,
        topProducts,
        ordersByChannel: revenueByChannel,
        couponPerformance,
      });
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) return <p className="text-sm text-gray-500">Loading analytics...</p>;
  if (!data) return <p className="text-sm text-red-500">Failed to load analytics</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <div className="flex gap-3">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border px-3 py-1.5 text-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border px-3 py-1.5 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Channel - PieChart */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-4 font-medium">Revenue by Channel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.revenueByChannel}
                dataKey="revenue"
                nameKey="channel"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${Number(value).toLocaleString()}d`}
              >
                {data.revenueByChannel.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()}d`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Over Time - LineChart */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-4 font-medium">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()}d`} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Volume by Channel - BarChart */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-4 font-medium">Order Volume by Channel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.ordersByChannel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="orderCount" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-4 font-medium">Top Products</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">#</th>
                <th className="pb-2">Product</th>
                <th className="pb-2">Units Sold</th>
                <th className="pb-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((p, i) => (
                <tr key={p.productId} className="border-b last:border-0">
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2">{p.productName}</td>
                  <td className="py-2">{p.unitsSold}</td>
                  <td className="py-2">{p.revenue.toLocaleString()}d</td>
                </tr>
              ))}
              {data.topProducts.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-gray-400">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AOV by Channel */}
      <AovChart dateFrom={dateFrom} dateTo={dateTo} />

      {/* Reseller Performance */}
      <ResellerPerformance dateFrom={dateFrom} dateTo={dateTo} />

      {/* Coupon Performance */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-4 font-medium">Coupon Performance</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">Code</th>
              <th className="pb-2">Usage Count</th>
              <th className="pb-2">Total Discount Given</th>
              <th className="pb-2">Orders Influenced</th>
            </tr>
          </thead>
          <tbody>
            {data.couponPerformance.map((c) => (
              <tr key={c.couponId} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{c.couponCode}</td>
                <td className="py-2">{c.usageCount}</td>
                <td className="py-2">{c.totalDiscountGiven.toLocaleString()}d</td>
                <td className="py-2">{c.ordersInfluenced}</td>
              </tr>
            ))}
            {data.couponPerformance.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
