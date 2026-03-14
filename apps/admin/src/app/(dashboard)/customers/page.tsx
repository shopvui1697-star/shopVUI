'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { DataTable, type Column } from '@/components/data-table';
import type { AdminCustomerListItem } from '@shopvui/shared';

interface CustomersResponse {
  customers: AdminCustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (minSpend) params.set('minSpend', minSpend);
      if (maxSpend) params.set('maxSpend', maxSpend);
      const res = await apiFetch<CustomersResponse>(`/admin/customers?${params}`);
      setData(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, minSpend, maxSpend]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const columns: Column<AdminCustomerListItem>[] = [
    { key: 'name', header: 'Name', render: (r) => r.name || '-' },
    { key: 'email', header: 'Email' },
    { key: 'orderCount', header: 'Orders' },
    { key: 'totalSpend', header: 'Total Spend', render: (r) => `${r.totalSpend.toLocaleString()}d` },
    { key: 'lastOrderDate', header: 'Last Order', render: (r) => r.lastOrderDate ? new Date(r.lastOrderDate).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customers</h2>
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="rounded-md border px-3 py-1.5 text-sm"
        />
        <input
          type="number"
          placeholder="Min spend"
          value={minSpend}
          onChange={(e) => { setMinSpend(e.target.value); setPage(1); }}
          className="w-32 rounded-md border px-3 py-1.5 text-sm"
        />
        <input
          type="number"
          placeholder="Max spend"
          value={maxSpend}
          onChange={(e) => { setMaxSpend(e.target.value); setPage(1); }}
          className="w-32 rounded-md border px-3 py-1.5 text-sm"
        />
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data?.customers ?? []}
          page={page}
          totalPages={data ? Math.ceil(data.total / data.pageSize) : 1}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/customers/${row.id}`)}
        />
      )}
    </div>
  );
}
