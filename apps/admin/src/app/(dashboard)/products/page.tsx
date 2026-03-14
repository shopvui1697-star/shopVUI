'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { DataTable, type Column } from '@/components/data-table';
import type { AdminProductListItem } from '@shopvui/shared';

interface ProductsResponse {
  data: AdminProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    apiFetch<{ id: string; name: string }[]>('/admin/categories').then(setCategories).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (search) params.set('search', search);
      if (category) params.set('categoryId', category);
      const res = await apiFetch<ProductsResponse>(`/admin/products?${params}`);
      setData(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    await apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  }

  const columns: Column<AdminProductListItem>[] = [
    { key: 'name', header: 'Name' },
    { key: 'categoryName', header: 'Category' },
    { key: 'price', header: 'Price', render: (r) => `${r.price.toLocaleString()}d` },
    { key: 'stockQuantity', header: 'Stock' },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <span className={`text-xs font-medium ${r.isActive ? 'text-green-600' : 'text-gray-400'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/products/${r.id}/edit`)}
            className="text-xs text-blue-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="text-xs text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products</h2>
        <button
          onClick={() => router.push('/products/new')}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          New Product
        </button>
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
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
        />
      )}
    </div>
  );
}
