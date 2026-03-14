'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Reseller {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function AdminResellersPage() {
  const router = useRouter();
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/admin/resellers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setResellers(data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading resellers...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Reseller Management</h1>
      <table className="w-full bg-white rounded-lg shadow">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm">Name</th>
            <th className="px-4 py-3 text-left text-sm">Email</th>
            <th className="px-4 py-3 text-left text-sm">Status</th>
            <th className="px-4 py-3 text-left text-sm">Joined</th>
          </tr>
        </thead>
        <tbody>
          {resellers.map((r) => (
            <tr key={r.id} className="border-t cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/admin/resellers/${r.id}`)}>
              <td className="px-4 py-3 text-sm">{r.name}</td>
              <td className="px-4 py-3 text-sm">{r.email}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  r.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  r.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-600'
                }`}>{r.status}</span>
              </td>
              <td className="px-4 py-3 text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
