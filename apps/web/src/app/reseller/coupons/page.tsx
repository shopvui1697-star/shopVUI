'use client';

import { useEffect, useState } from 'react';
import * as api from '@/lib/api';

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number | null;
  isActive: boolean;
  commissionType: string | null;
  commissionValue: number | null;
  usageCount?: number;
}

export default function ResellerCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [proposing, setProposing] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const loadCoupons = () => {
    const token = localStorage.getItem('reseller_token');
    if (!token) return;
    api.getResellerCoupons(token).then(setCoupons).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadCoupons(); }, []);

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('reseller_token');
    if (!token || !newCode.trim()) return;

    setProposing(true);
    setMessage('');
    try {
      await api.proposeResellerCoupon(token, newCode.trim());
      setMessage('Coupon proposed! Waiting for admin approval.');
      setNewCode('');
      loadCoupons();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setProposing(false);
    }
  };

  const copyShareableLink = (code: string) => {
    const url = `${window.location.origin}?coupon=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (loading) return <div className="p-8 text-center">Loading coupons...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Coupons</h1>

      <form onSubmit={handlePropose} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Propose a coupon code (e.g., MYNAME10)"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" disabled={proposing} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {proposing ? 'Submitting...' : 'Propose'}
        </button>
      </form>
      {message && <p className={`text-sm mb-4 ${message.includes('Waiting') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

      {coupons.length === 0 ? (
        <p className="text-gray-500">No coupons yet. Propose one above!</p>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-lg font-bold">{c.code}</span>
                <span className={`ml-3 px-2 py-0.5 rounded text-xs ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {c.isActive ? 'Active' : 'Pending Approval'}
                </span>
                {c.isActive && c.value && (
                  <span className="ml-2 text-sm text-gray-500">
                    {c.type === 'PERCENTAGE' ? `${c.value}% off` : `${c.value.toLocaleString()} VND off`}
                  </span>
                )}
              </div>
              {c.isActive && (
                <div className="flex items-center gap-3">
                  {typeof c.usageCount === 'number' && (
                    <span className="text-sm text-gray-500" data-testid="usage-count">
                      {c.usageCount} {c.usageCount === 1 ? 'use' : 'uses'}
                    </span>
                  )}
                  <button
                    onClick={() => copyShareableLink(c.code)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    data-testid="copy-link-button"
                  >
                    {copied === c.code ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
