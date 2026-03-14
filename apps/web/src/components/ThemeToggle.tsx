'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown-item';
  onToggle?: () => void;
  className?: string;
}

export function ThemeToggle({ variant = 'icon', onToggle, className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const t = useTranslations('theme');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const label = isDark ? t('switchToLight') : t('switchToDark');

  const handleClick = () => {
    setTheme(isDark ? 'light' : 'dark');
    onToggle?.();
  };

  if (!mounted) {
    if (variant === 'dropdown-item') return null;
    return <div className={clsx('h-9 w-9', className)} />;
  }

  if (variant === 'dropdown-item') {
    return (
      <button
        onClick={handleClick}
        className={clsx(
          'flex w-full items-center gap-2.5 px-4 py-2.5',
          'text-sm text-neutral-700 dark:text-neutral-300',
          'hover:bg-neutral-50 dark:hover:bg-neutral-800',
          'transition-colors',
          className
        )}
      >
        {isDark ? <SunIcon className="h-4 w-4 text-neutral-400" /> : <MoonIcon className="h-4 w-4 text-neutral-400" />}
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'flex h-9 w-9 items-center justify-center rounded-lg',
        'text-neutral-600 transition-colors',
        'hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
        className
      )}
      aria-label={label}
    >
      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
