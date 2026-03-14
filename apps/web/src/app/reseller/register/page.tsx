'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import * as api from '@/lib/api';

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
  reason: string;
}

const EMPTY: FormState = { name: '', email: '', password: '', phone: '', reason: '' };

export default function ResellerRegisterPage() {
  const t = useTranslations('reseller.register');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const touch = (field: keyof FormState) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const errors: Partial<Record<keyof FormState, string>> = {
    name: !form.name ? t('fullNameRequired') : undefined,
    email: !form.email ? t('emailRequired') : undefined,
    password: !form.password
      ? t('passwordRequired')
      : form.password.length < 8
        ? t('passwordMinLength')
        : undefined,
  };

  const isValid = !errors.name && !errors.email && !errors.password;

  const inputClass = (field: keyof FormState, required = true) => {
    const hasError = required && touched[field] && errors[field as keyof typeof errors];
    const isFilled = !!form[field];
    return clsx(
      'w-full rounded-lg border px-3 py-2.5 text-sm transition-colors',
      'bg-white text-black placeholder-neutral-400',
      'focus:outline-none focus:ring-1',
      'dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500',
      hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
        : isFilled
          ? 'border-green-400 focus:border-green-500 focus:ring-green-500 dark:border-green-600'
          : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-600',
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!isValid) return;

    setLoading(true);
    setError('');
    try {
      await api.resellerRegister(form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-950/30">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-800 dark:text-green-300">{t('applicationSubmitted')}</h2>
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            {t('applicationMessage')}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 dark:border-neutral-700 dark:bg-neutral-900">
        <h1 className="text-2xl font-bold text-black dark:text-white">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {t('subtitle')}
        </p>
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          {t('fieldsRequired').split('*')[0]}<span className="text-red-500">*</span>{t('fieldsRequired').split('*')[1]}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('fullName')}
              <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              onBlur={touch('name')}
              placeholder={t('fullNamePlaceholder')}
              aria-required="true"
              className={inputClass('name')}
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('email')}
              <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              onBlur={touch('email')}
              placeholder={t('emailPlaceholder')}
              aria-required="true"
              className={inputClass('email')}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('password')}
              <span className="text-red-500" aria-hidden="true">*</span>
              <span className="ml-1 text-xs font-normal text-neutral-400">{t('passwordHint')}</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              onBlur={touch('password')}
              placeholder={t('passwordPlaceholder')}
              minLength={8}
              aria-required="true"
              className={inputClass('password')}
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Phone — optional */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('phone')}
              <span className="ml-1 text-xs font-normal text-neutral-400">{t('phoneOptional')}</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder={t('phonePlaceholder')}
              className={inputClass('phone', false)}
            />
          </div>

          {/* Reason — optional */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('reason')}
              <span className="ml-1 text-xs font-normal text-neutral-400">{t('reasonOptional')}</span>
            </label>
            <textarea
              value={form.reason}
              onChange={set('reason')}
              placeholder={t('reasonPlaceholder')}
              rows={3}
              className={clsx(
                'w-full rounded-lg border px-3 py-2.5 text-sm transition-colors',
                'bg-white text-black placeholder-neutral-400',
                'focus:outline-none focus:ring-1',
                'dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500',
                form.reason
                  ? 'border-green-400 focus:border-green-500 focus:ring-green-500 dark:border-green-600'
                  : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-600',
              )}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              'w-full rounded-full py-3 text-sm font-semibold text-white transition-colors',
              loading
                ? 'cursor-not-allowed bg-neutral-400 dark:bg-neutral-600'
                : 'bg-blue-600 hover:bg-blue-700',
            )}
          >
            {loading ? t('submitting') : t('submitApplication')}
          </button>
        </form>
      </div>
    </main>
  );
}
