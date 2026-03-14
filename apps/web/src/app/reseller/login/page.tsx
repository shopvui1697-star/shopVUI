'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as api from '@/lib/api';

export default function ResellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.resellerLogin(email, password);
      localStorage.setItem('reseller_token', result.accessToken);
      router.push('/reseller/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6">Reseller Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
        <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4 text-center">
        Not a reseller yet? <Link href="/reseller/register" className="text-blue-600">Apply here</Link>
      </p>
    </div>
  );
}
