'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import type { Category } from '@shopvui/shared';

interface SearchFilterProps {
  categories: Category[];
}

export function SearchFilter({ categories }: SearchFilterProps) {
  const searchParams = useSearchParams();
  const t = useTranslations('products');
  const currentCategoryId = searchParams.get('categoryId') ?? '';

  const createUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      if ('categoryId' in updates) {
        params.delete('page');
      }
      const qs = params.toString();
      return `/products${qs ? `?${qs}` : ''}`;
    },
    [searchParams],
  );

  const allCategories = categories.flatMap((cat) => [cat, ...(cat.children ?? [])]);

  return (
    <div className="order-first w-full flex-none md:max-w-[125px]">
      <nav>
        <h3 className="hidden text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 md:block">
          {t('categories')}
        </h3>
        <ul className="mt-2 hidden md:block">
          <li className="mb-1">
            <a
              href={createUrl({ categoryId: undefined })}
              className={clsx(
                'block w-full text-sm underline-offset-4 hover:underline',
                currentCategoryId === ''
                  ? 'font-bold text-black dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400',
              )}
            >
              {t('all')}
            </a>
          </li>
          {allCategories.map((cat) => (
            <li key={cat.id} className="mb-1">
              <a
                href={createUrl({ categoryId: cat.id })}
                className={clsx(
                  'block w-full text-sm underline-offset-4 hover:underline',
                  currentCategoryId === cat.id
                    ? 'font-bold text-black dark:text-white'
                    : 'text-neutral-500 dark:text-neutral-400',
                )}
              >
                {cat.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
