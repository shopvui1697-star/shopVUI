'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CHANNEL_LABELS } from '@/lib/constants';
import type { CsvImportResult } from '@shopvui/shared';

export default function ImportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [channel, setChannel] = useState('SHOPEE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState('');

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('channel', channel);
      const res = await apiFetch<CsvImportResult>('/admin/imports/orders', {
        method: 'POST',
        body: formData,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">CSV Import</h2>
      <div className="max-w-md space-y-4 rounded-lg border bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
          >
            {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Importing...' : 'Import'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <div className="space-y-3 rounded-lg border bg-white p-6">
          <h3 className="font-medium">Import Results</h3>
          <div className="flex gap-6 text-sm">
            <span className="text-green-600">Imported: {result.imported}</span>
            <span className="text-yellow-600">Skipped: {result.skipped}</span>
            <span className="text-red-600">Errors: {result.errors.length}</span>
          </div>
          {result.errors.length > 0 && (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Row</th>
                  <th className="pb-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.map((err, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1">{err.row}</td>
                    <td className="py-1 text-red-600">{err.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
