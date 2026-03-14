'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface PriceTier {
  id: string;
  minQty: number;
  maxQty: number | null;
  price: number;
}

interface PriceTierForm {
  minQty: string;
  maxQty: string;
  price: string;
}

const emptyForm: PriceTierForm = { minQty: '', maxQty: '', price: '' };

export function PriceTierEditor({ productId }: { productId: string }) {
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingRow, setAddingRow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PriceTierForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function fetchTiers() {
    try {
      const data = await apiFetch<PriceTier[]>(`/admin/products/${productId}/price-tiers`);
      setTiers(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTiers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function startAdd() {
    setAddingRow(true);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function startEdit(tier: PriceTier) {
    setEditingId(tier.id);
    setAddingRow(false);
    setForm({
      minQty: String(tier.minQty),
      maxQty: tier.maxQty !== null ? String(tier.maxQty) : '',
      price: String(tier.price),
    });
    setError('');
  }

  function cancelEdit() {
    setAddingRow(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const body = {
      minQty: Number(form.minQty),
      maxQty: form.maxQty ? Number(form.maxQty) : null,
      price: Number(form.price),
    };
    try {
      if (editingId) {
        await apiFetch(`/admin/products/${productId}/price-tiers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(`/admin/products/${productId}/price-tiers`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      cancelEdit();
      await fetchTiers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tier');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tierId: string) {
    try {
      await apiFetch(`/admin/products/${productId}/price-tiers/${tierId}`, {
        method: 'DELETE',
      });
      await fetchTiers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tier');
    }
  }

  function formatVND(value: number) {
    return `${value.toLocaleString()}d`;
  }

  if (loading) return <p className="text-sm text-gray-500">Loading price tiers...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Price Tiers</h3>
        {!addingRow && !editingId && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
          >
            Add Tier
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Min Qty</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Max Qty</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Price</th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tiers.map((tier) =>
              editingId === tier.id ? (
                <tr key={tier.id}>
                  <td className="px-4 py-2">
                    <input type="number" min="1" value={form.minQty} onChange={(e) => setForm({ ...form, minQty: e.target.value })} className="w-24 rounded border px-2 py-1 text-sm" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="1" value={form.maxQty} onChange={(e) => setForm({ ...form, maxQty: e.target.value })} placeholder="Unlimited" className="w-24 rounded border px-2 py-1 text-sm" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-32 rounded border px-2 py-1 text-sm" />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={handleSave} disabled={saving} className="mr-2 text-blue-600 hover:underline disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={cancelEdit} className="text-gray-500 hover:underline">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={tier.id}>
                  <td className="px-4 py-2">{tier.minQty}</td>
                  <td className="px-4 py-2">{tier.maxQty !== null ? tier.maxQty : 'Unlimited'}</td>
                  <td className="px-4 py-2">{formatVND(tier.price)}</td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => startEdit(tier)} className="mr-2 text-blue-600 hover:underline">Edit</button>
                    <button type="button" onClick={() => handleDelete(tier.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ),
            )}
            {addingRow && (
              <tr>
                <td className="px-4 py-2">
                  <input type="number" min="1" value={form.minQty} onChange={(e) => setForm({ ...form, minQty: e.target.value })} className="w-24 rounded border px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <input type="number" min="1" value={form.maxQty} onChange={(e) => setForm({ ...form, maxQty: e.target.value })} placeholder="Unlimited" className="w-24 rounded border px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2">
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-32 rounded border px-2 py-1 text-sm" />
                </td>
                <td className="px-4 py-2 text-right">
                  <button type="button" onClick={handleSave} disabled={saving} className="mr-2 text-blue-600 hover:underline disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={cancelEdit} className="text-gray-500 hover:underline">Cancel</button>
                </td>
              </tr>
            )}
            {tiers.length === 0 && !addingRow && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-gray-400">No price tiers defined</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
