'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import type { AddressData } from '@shopvui/shared';
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import * as api from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Footer } from '../../../components/layout/footer';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  street: '',
  ward: '',
  district: '',
  province: '',
  isDefault: false,
};

export default function AddressesPage() {
  const { token } = useAuth();
  const t = useTranslations('account.addresses');

  const FIELD_LABELS: Record<string, string> = {
    fullName: t('fullName'),
    phone: t('phone'),
    street: t('street'),
    ward: t('ward'),
    district: t('district'),
    province: t('provinceCity'),
  };
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const loadAddresses = () => {
    if (!token) return;
    api.getAddresses(token).then(setAddresses).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAddresses();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const requiredFields = ['fullName', 'phone', 'street', 'ward', 'district', 'province'];
    const allTouched = Object.fromEntries(requiredFields.map((f) => [f, true]));
    setTouched(allTouched);
    if (requiredFields.some((f) => !form[f as keyof typeof form])) return;

    if (editingId) {
      await api.updateAddress(token, editingId, form);
    } else {
      await api.createAddress(token, form);
    }

    setForm(EMPTY_FORM);
    setTouched({});
    setShowForm(false);
    setEditingId(null);
    loadAddresses();
  };

  const handleEdit = (addr: AddressData) => {
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      ward: addr.ward,
      district: addr.district,
      province: addr.province,
      isDefault: addr.isDefault,
    });
    setTouched({});
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm(t('deleteConfirm'))) return;
    await api.deleteAddress(token, id);
    loadAddresses();
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    await api.setDefaultAddress(token, id);
    loadAddresses();
  };

  if (!token) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-neutral-500 dark:text-neutral-400">{t('loginRequired')}</p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black dark:text-white">{t('title')}</h1>
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setEditingId(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            {t('addAddress')}
          </button>
        </div>

        {/* Address Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-lg border border-neutral-200 p-6 dark:border-neutral-700"
            noValidate
          >
            <h2 className="mb-1 text-lg font-semibold text-black dark:text-white">
              {editingId ? t('editAddress') : t('newAddress')}
            </h2>
            <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
              {t('fieldsRequired').split('*')[0]}<span className="text-red-500">*</span>{t('fieldsRequired').split('*')[1]}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(['fullName', 'phone', 'street', 'ward', 'district', 'province'] as const).map(
                (field) => {
                  const hasError = touched[field] && !form[field];
                  const isFilled = !!form[field];
                  return (
                    <div key={field} className={field === 'street' ? 'sm:col-span-2' : ''}>
                      <label className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {FIELD_LABELS[field]}
                        <span className="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="text"
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        onBlur={() => setTouched((prev) => ({ ...prev, [field]: true }))}
                        aria-required="true"
                        className={clsx(
                          'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
                          'bg-white text-black placeholder-neutral-400',
                          'focus:outline-none focus:ring-1',
                          'dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500',
                          hasError
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
                            : isFilled
                              ? 'border-green-400 focus:border-green-500 focus:ring-green-500 dark:border-green-600'
                              : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-600',
                        )}
                      />
                      {hasError && (
                        <p className="mt-1 text-xs text-red-500">{t('fieldRequired', { field: FIELD_LABELS[field] })}</p>
                      )}
                    </div>
                  );
                },
              )}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="rounded accent-blue-600"
              />
              {t('setAsDefault')}
            </label>
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {editingId ? t('update') : t('save')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setTouched({});
                }}
                className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {/* Address List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600 dark:border-t-blue-400" />
          </div>
        ) : addresses.length === 0 ? (
          <p className="py-12 text-center text-neutral-500 dark:text-neutral-400">
            {t('noAddresses')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={clsx(
                  'rounded-lg border-2 p-4',
                  addr.isDefault
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-neutral-200 dark:border-neutral-700'
                )}
                data-testid="address-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-black dark:text-white">
                      {addr.fullName}
                      {addr.isDefault && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <StarSolidIcon className="h-3 w-3" />
                          {t('default')}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{addr.phone}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(addr)}
                      className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-blue-600 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-blue-400"
                      title={t('edit')}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-green-600 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-green-400"
                        title={t('setDefault')}
                      >
                        <StarIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-red-400"
                      title={t('delete')}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
