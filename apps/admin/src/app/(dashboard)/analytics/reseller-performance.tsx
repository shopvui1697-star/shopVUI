'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface ResellerRow {
  resellerId: string;
  resellerName: string;
  revenue: number;
  commissionCost: number;
  orderCount: number;
  conversionRate: number;
}

interface ResellerPerfData {
  summary: {
    totalCommissionPaid: number;
    totalResellerRevenue: number;
    avgCommissionRate: number;
    resellerOrderCount: number;
    totalOrderCount: number;
  };
  resellers: ResellerRow[];
}

interface ResellerPerformanceProps {
  dateFrom: string;
  dateTo: string;
}

export function ResellerPerformance({ dateFrom, dateTo }: ResellerPerformanceProps) {
  const [data, setData] = useState<ResellerPerfData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const qs = params.toString() ? `?${params}` : '';
      const res = await apiFetch<ResellerPerfData>(`/admin/analytics/reseller-performance${qs}`);
      setData(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <p className="text-sm text-gray-500">Loading reseller data...</p>;
  if (!data) return <p className="text-sm text-red-500">Failed to load reseller data</p>;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-500">Total Reseller Revenue</p>
          <p className="mt-1 text-xl font-semibold">{data.summary.totalResellerRevenue.toLocaleString()}d</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-500">Total Commission Paid</p>
          <p className="mt-1 text-xl font-semibold">{data.summary.totalCommissionPaid.toLocaleString()}d</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-500">Avg Commission Rate</p>
          <p className="mt-1 text-xl font-semibold">{(data.summary.avgCommissionRate * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-500">Reseller Orders</p>
          <p className="mt-1 text-xl font-semibold">
            {data.summary.resellerOrderCount} / {data.summary.totalOrderCount}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-4 font-medium">Reseller Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Reseller</th>
                <th className="pb-2 pr-4">Revenue</th>
                <th className="pb-2 pr-4">Commission</th>
                <th className="pb-2 pr-4">Orders</th>
                <th className="pb-2">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.resellers.map((r, i) => (
                <tr key={r.resellerId} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <span className={i < 3 ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-800' : ''}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-medium">{r.resellerName}</td>
                  <td className="py-2 pr-4">{r.revenue.toLocaleString()}d</td>
                  <td className="py-2 pr-4">{r.commissionCost.toLocaleString()}d</td>
                  <td className="py-2 pr-4">{r.orderCount}</td>
                  <td className="py-2">{(r.conversionRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
              {data.resellers.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-gray-400">No reseller data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
