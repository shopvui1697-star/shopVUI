'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { apiFetch } from '@/lib/api';

interface AovChannel {
  channel: string;
  aov: number;
  orderCount: number;
  revenue: number;
}

interface AovData {
  summary: { overallAov: number; totalOrders: number; totalRevenue: number };
  channels: AovChannel[];
}

type Granularity = 'daily' | 'weekly' | 'monthly';

interface AovChartProps {
  dateFrom: string;
  dateTo: string;
}

export function AovChart({ dateFrom, dateTo }: AovChartProps) {
  const [data, setData] = useState<AovData | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>('monthly');

  const fetchAov = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('granularity', granularity);
      const res = await apiFetch<AovData>(`/admin/analytics/aov-by-channel?${params}`);
      setData(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, granularity]);

  useEffect(() => {
    fetchAov();
  }, [fetchAov]);

  if (loading) return <p className="text-sm text-gray-500">Loading AOV data...</p>;
  if (!data) return <p className="text-sm text-red-500">Failed to load AOV data</p>;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-500">Overall AOV</p>
          <p className="mt-1 text-xl font-semibold">{data.summary.overallAov.toLocaleString()}d</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-500">Total Orders</p>
          <p className="mt-1 text-xl font-semibold">{data.summary.totalOrders.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-500">Total Revenue</p>
          <p className="mt-1 text-xl font-semibold">{data.summary.totalRevenue.toLocaleString()}d</p>
        </div>
      </div>

      {/* Chart with granularity selector */}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">AOV by Channel</h3>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.channels}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `${Number(value).toLocaleString()}d`} />
            <Bar dataKey="aov" fill="#3b82f6" name="AOV" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
