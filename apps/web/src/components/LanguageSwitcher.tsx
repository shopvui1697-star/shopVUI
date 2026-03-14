'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { locales, LOCALE_COOKIE, type Locale } from '../i18n/config';

export function LanguageSwitcher({
  variant = 'dropdown-item',
  onSelect,
}: {
  variant?: 'dropdown-item' | 'standalone';
  onSelect?: () => void;
}) {
  const t = useTranslations('language');
  const currentLocale = useLocale();
  const router = useRouter();

  const switchLocale = (locale: Locale) => {
    if (locale === currentLocale) return;
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
    localStorage.setItem(LOCALE_COOKIE, locale);
    router.refresh();
    onSelect?.();
  };

  if (variant === 'standalone') {
    const nextLocale = currentLocale === 'vi' ? 'en' : 'vi';
    return (
      <button
        onClick={() => switchLocale(nextLocale as Locale)}
        className={clsx(
          'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm',
          'text-neutral-600 transition-colors hover:bg-neutral-100',
          'dark:text-neutral-400 dark:hover:bg-neutral-800'
        )}
        aria-label={t('switchTo')}
      >
        <GlobeAltIcon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase">{currentLocale}</span>
      </button>
    );
  }

  return (
    <div className="border-t py-1 dark:border-neutral-700">
      <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-400 flex items-center gap-1.5">
        <GlobeAltIcon className="h-3.5 w-3.5" />
        {t('switchTo')}
      </div>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={clsx(
            'flex w-full items-center justify-between px-4 py-2 text-sm transition-colors',
            currentLocale === locale
              ? 'font-semibold text-blue-600 dark:text-blue-400'
              : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
          )}
        >
          {t(locale)}
          {currentLocale === locale && (
            <span className="text-xs text-blue-600 dark:text-blue-400">&#10003;</span>
          )}
        </button>
      ))}
    </div>
  );
}
