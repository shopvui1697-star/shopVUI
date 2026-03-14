'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import * as api from '@/lib/api';

export default function ResellerProfilePage() {
  const t = useTranslations('reseller.profile');
  const [profile, setProfile] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('reseller_token');
    if (!token) return;

    api.getResellerProfile(token).then((p) => {
      setProfile(p);
      setPhone(p.phone ?? '');
      setBankName(p.bankInfo?.bankName ?? '');
      setAccountNumber(p.bankInfo?.accountNumber ?? '');
      setAccountHolder(p.bankInfo?.accountHolder ?? '');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('reseller_token');
    if (!token) return;

    setSaving(true);
    setMessage('');
    try {
      await api.updateResellerProfile(token, {
        phone,
        bankInfo: { bankName, accountNumber, accountHolder },
      });
      setMessage(t('profileUpdated'));
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">{t('loadingProfile')}</div>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
          <input type="text" value={profile?.name ?? ''} disabled className="w-full border rounded px-3 py-2 bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
          <input type="email" value={profile?.email ?? ''} disabled className="w-full border rounded px-3 py-2 bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <h3 className="text-lg font-semibold mt-6">{t('bankInformation')}</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('bankName')}</label>
          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('accountNumber')}</label>
          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('accountHolder')}</label>
          <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        {message && <p className={`text-sm ${message === t('profileUpdated') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {saving ? t('saving') : t('saveChanges')}
        </button>
      </form>
    </div>
  );
}
