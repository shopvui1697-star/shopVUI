'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function AdminResellerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reseller, setReseller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadReseller = () => {
    if (!token) return;
    fetch(`${API_URL}/admin/resellers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setReseller)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReseller(); }, [id]);

  const handleAction = async (action: string) => {
    if (!token) return;
    if (action === 'deactivate' && !confirm('Deactivate this reseller? Their coupons will also be deactivated.')) return;

    setActionLoading(true);
    try {
      await fetch(`${API_URL}/admin/resellers/${id}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadReseller();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!reseller) return <div className="p-8 text-center text-red-600">Reseller not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={() => router.back()} className="text-blue-600 text-sm mb-4">&larr; Back</button>
      <h1 className="text-2xl font-bold mb-2">{reseller.name}</h1>
      <p className="text-gray-500 mb-6">{reseller.email} | {reseller.phone ?? 'No phone'}</p>

      <div className="flex gap-2 mb-6">
        {reseller.status === 'PENDING' && (
          <>
            <button onClick={() => handleAction('approve')} disabled={actionLoading} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50">Approve</button>
            <button onClick={() => handleAction('reject')} disabled={actionLoading} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50">Reject</button>
          </>
        )}
        {reseller.status === 'ACTIVE' && (
          <button onClick={() => handleAction('deactivate')} disabled={actionLoading} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50">Deactivate</button>
        )}
        <span className={`px-3 py-2 rounded text-sm font-medium ${
          reseller.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          reseller.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-600'
        }`}>{reseller.status}</span>
      </div>

      {reseller.coupons?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Coupons</h2>
          <div className="space-y-2">
            {reseller.coupons.map((c: any) => (
              <div key={c.id} className="bg-white rounded shadow p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold">{c.code}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {c.isActive ? 'Active' : 'Pending'}
                  </span>
                </div>
                {!c.isActive && (
                  <Link href={`/admin/resellers/${id}/coupons/${c.id}/approve`} className="text-sm text-blue-600 hover:text-blue-800">
                    Approve &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Stats</h2>
        <p className="text-sm text-gray-500">Orders: {reseller._count?.orders ?? 0} | Commissions: {reseller._count?.commissions ?? 0}</p>
      </div>
    </div>
  );
}
