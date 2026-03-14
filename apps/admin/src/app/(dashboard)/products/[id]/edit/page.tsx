'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { PriceTierEditor } from './price-tiers-editor';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  images: ProductImage[];
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
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadProduct = useCallback(async () => {
    try {
      const [product, cats] = await Promise.all([
        apiFetch<ProductData>(`/admin/products/${params.id}`),
        apiFetch<{ id: string; name: string }[]>('/admin/categories'),
      ]);
      setForm({
        name: product.name,
        description: product.description || '',
        basePrice: String(product.price),
        categoryId: product.categoryId || '',
        stockQuantity: String(product.stockQuantity),
      });
      setImages(product.images);
      setCategories(cats);
    } catch { /* handled */ }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

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
      router.push('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadFiles() {
    if (newFiles.length === 0) return;
    setUploading(true);
    try {
      for (const file of newFiles) {
        const fd = new FormData();
        fd.append('file', file);
        await apiFetch(`/admin/products/${params.id}/images`, {
          method: 'POST',
          body: fd,
        });
      }
      setNewFiles([]);
      const product = await apiFetch<ProductData>(`/admin/products/${params.id}`);
      setImages(product.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm('Delete this image?')) return;
    try {
      await apiFetch(`/admin/products/${params.id}/images/${imageId}`, { method: 'DELETE' });
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  }

  async function handleUpdateAlt(imageId: string, alt: string) {
    try {
      await apiFetch(`/admin/products/${params.id}/images/${imageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ alt }),
      });
      setImages((prev) => prev.map((img) => img.id === imageId ? { ...img, alt } : img));
    } catch { /* silent */ }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>

      <div className="max-w-lg rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Product Images ({images.length})</h3>

        {images.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img) => (
              <div key={img.id} className="group relative rounded-lg border bg-gray-50 p-2">
                <div className="relative aspect-square overflow-hidden rounded-md bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url.startsWith('http') ? img.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${img.url}`}
                    alt={img.alt || 'Product image'}
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                    title="Delete image"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Alt text..."
                  defaultValue={img.alt || ''}
                  onBlur={(e) => handleUpdateAlt(img.id, e.target.value)}
                  className="mt-2 block w-full rounded border px-2 py-1 text-xs text-gray-700 placeholder:text-gray-400"
                />
              </div>
            ))}
          </div>
        )}

        {images.length === 0 && (
          <p className="mb-4 text-sm text-gray-400">No images yet</p>
        )}

        <div className="space-y-3 border-t pt-4">
          <label className="block text-sm font-medium text-gray-700">Upload New Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
          {newFiles.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{newFiles.length} file(s) selected</span>
              <button
                type="button"
                onClick={handleUploadFiles}
                disabled={uploading}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}
        </div>
      </div>

      <PriceTierEditor productId={params.id} />
    </div>
  );
}
