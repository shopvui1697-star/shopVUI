'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('reseller.coupons');
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
      setMessage(t('proposedSuccess'));
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

  if (loading) return <div className="p-8 text-center">{t('loadingCoupons')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <form onSubmit={handlePropose} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder={t('proposePlaceholder')}
          value={newCode}
          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" disabled={proposing} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {proposing ? t('submitting') : t('propose')}
        </button>
      </form>
      {message && <p className={`text-sm mb-4 ${message === t('proposedSuccess') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

      {coupons.length === 0 ? (
        <p className="text-gray-500">{t('noCoupons')}</p>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-lg font-bold">{c.code}</span>
                <span className={`ml-3 px-2 py-0.5 rounded text-xs ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {c.isActive ? t('active') : t('pendingApproval')}
                </span>
                {c.isActive && c.value && (
                  <span className="ml-2 text-sm text-gray-500">
                    {c.type === 'PERCENTAGE' ? t('percentOff', { value: c.value }) : t('fixedOff', { value: c.value!.toLocaleString() })}
                  </span>
                )}
              </div>
              {c.isActive && (
                <div className="flex items-center gap-3">
                  {typeof c.usageCount === 'number' && (
                    <span className="text-sm text-gray-500" data-testid="usage-count">
                      {c.usageCount === 1 ? t('use', { count: c.usageCount }) : t('uses', { count: c.usageCount })}
                    </span>
                  )}
                  <button
                    onClick={() => copyShareableLink(c.code)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    data-testid="copy-link-button"
                  >
                    {copied === c.code ? t('copied') : t('copyLink')}
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
