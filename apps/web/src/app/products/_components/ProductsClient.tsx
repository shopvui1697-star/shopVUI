'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ProductCard, CategoryPill, SearchBar } from '@shopvui/ui';
import type { Product, Category, PaginatedResponse } from '@shopvui/shared';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface ProductsClientProps {
  initialProducts: PaginatedResponse<Product>;
  categories: Category[];
  initialSearch: string;
  initialCategoryId: string;
}

export function ProductsClient({
  initialProducts,
  categories,
  initialSearch,
  initialCategoryId,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('products');

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 when search or filter changes
      if ('search' in updates || 'categoryId' in updates) {
        params.delete('page');
      }
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearch = useCallback(
    (value: string) => {
      updateParams({ search: value || undefined });
    },
    [updateParams],
  );

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      const current = searchParams.get('categoryId');
      updateParams({ categoryId: current === categoryId ? undefined : categoryId });
    },
    [updateParams, searchParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateParams({ page: page > 1 ? String(page) : undefined });
    },
    [updateParams],
  );

  const { data: products, page, totalPages } = initialProducts;

  // Flatten categories for pills (parent + children)
  const allCategories = categories.flatMap((cat) => [cat, ...(cat.children ?? [])]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <SearchBar value={initialSearch} onSearch={handleSearch} />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {allCategories.map((cat) => (
          <CategoryPill
            key={cat.id}
            category={cat}
            isActive={initialCategoryId === cat.id}
            onClick={handleCategoryClick}
          />
        ))}
      </div>

      {products.length === 0 ? (
        <p data-testid="empty-state">{t('noProducts')}</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <ProductCard product={product} />
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', alignItems: 'center' }}>
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                data-testid="prev-page"
              >
                {t('previous')}
              </button>
              <span>
                {t('pageOf', { current: String(page), total: String(totalPages) })}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                data-testid="next-page"
              >
                {t('next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
