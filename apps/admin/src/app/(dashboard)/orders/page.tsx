'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge, ChannelBadge } from '@/components/status-badge';
import { ORDER_STATUS_LABELS, CHANNEL_LABELS, type OrderStatus } from '@/lib/constants';
import type { AdminOrderListItem } from '@shopvui/shared';

interface OrdersResponse {
  data: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (channel) params.set('channel', channel);
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await apiFetch<OrdersResponse>(`/admin/orders?${params}`);
      setData(res);
    } catch {
      // handled by api.ts redirect
    } finally {
      setLoading(false);
    }
  }, [page, channel, status, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function transitionOrder(id: string, target: OrderStatus) {
    const TRANSITION_PATH: Partial<Record<OrderStatus, OrderStatus[]>> = {
      PENDING: ['CONFIRMED', 'SHIPPING'],
      CONFIRMED: ['SHIPPING'],
    };
    const order = data?.data.find((o) => o.id === id);
    if (!order) return;

    const steps = TRANSITION_PATH[order.status as OrderStatus];
    if (!steps) return;

    for (const step of steps) {
      await apiFetch(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: step }),
      });
      if (step === target) break;
    }
  }

  async function handleBulkShip() {
    if (selected.size === 0) return;
    const errors: string[] = [];
    for (const id of selected) {
      try {
        await transitionOrder(id, 'SHIPPING');
      } catch {
        const order = data?.data.find((o) => o.id === id);
        errors.push(order?.orderNumber || id);
      }
    }
    if (errors.length > 0) {
      alert(`Could not ship orders: ${errors.join(', ')}`);
    }
    setSelected(new Set());
    fetchOrders();
  }

  function handlePrintInvoices() {
    if (selected.size === 0) return;
    if (selected.size > 50) {
      alert('Please select 50 or fewer orders for printing');
      return;
    }
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const ids = Array.from(selected).join(',');
    window.open(`${API_URL}/admin/orders/invoices?ids=${ids}`, '_blank');
  }

  const columns: Column<AdminOrderListItem>[] = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'customerName', header: 'Customer', render: (r) => r.customerName || r.customerEmail || '-' },
    { key: 'channel', header: 'Channel', render: (r) => <ChannelBadge channel={r.channel} /> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'total', header: 'Total', render: (r) => `${r.total.toLocaleString()}d` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Orders</h2>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleBulkShip}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
            >
              Mark Shipped ({selected.size})
            </button>
            <button
              onClick={handlePrintInvoices}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Print Invoices ({selected.size})
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
        />
        <select
          value={channel}
          onChange={(e) => { setChannel(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="">All Channels</option>
          {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
        />
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          page={page}
          totalPages={data ? Math.ceil(data.total / data.pageSize) : 1}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/orders/${row.id}`)}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
        />
      )}
    </div>
  );
}
