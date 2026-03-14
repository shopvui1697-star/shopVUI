'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { PriceTierEditor } from './price-tiers-editor';

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  imageUrl: string | null;
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    categoryId: '',
    stockQuantity: '',
  });
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<ProductData>(`/admin/products/${params.id}`),
      apiFetch<{ id: string; name: string }[]>('/admin/categories'),
    ]).then(([product, cats]) => {
      setForm({
        name: product.name,
        description: product.description || '',
        basePrice: String(product.price),
        categoryId: product.categoryId || '',
        stockQuantity: String(product.stockQuantity),
      });
      setCategories(cats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/admin/products/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          basePrice: Number(form.basePrice),
          categoryId: form.categoryId,
          stockQuantity: Number(form.stockQuantity),
        }),
      });
      if (image) {
        const fd = new FormData();
        fd.append('file', image);
        await apiFetch(`/admin/products/${params.id}/image`, {
          method: 'POST',
          body: fd,
        });
      }
      router.push('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Edit Product</h2>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-lg border bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Price</label>
            <input required type="number" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
            <input required type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 block w-full rounded-md border px-3 py-2 text-sm">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>

      <PriceTierEditor productId={params.id} />
    </div>
  );
}
