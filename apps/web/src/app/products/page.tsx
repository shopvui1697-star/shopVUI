import Link from 'next/link';
import { getProducts, getCategories } from '../../lib/api';
import { GridTileImage } from '../../components/grid/tile';
import { Footer } from '../../components/layout/footer';
import { SearchFilter } from './search-filter';
import { Suspense } from 'react';

interface ProductsPageProps {
  searchParams: Promise<{ search?: string; categoryId?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const [productsData, categories] = await Promise.all([
    getProducts({
      search: params.search,
      categoryId: params.categoryId,
      page,
    }),
    getCategories(),
  ]);

  const { data: products, totalPages } = productsData;

  return (
    <>
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 pb-4 text-black dark:text-white md:flex-row">
        <Suspense>
          <SearchFilter categories={categories} />
        </Suspense>

        <div className="min-h-screen w-full">
          {params.search ? (
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
              Showing results for{' '}
              <span className="font-semibold text-black dark:text-white">
                &lsquo;{params.search}&rsquo;
              </span>
            </p>
          ) : (
            <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">All Products</p>
          )}

          {products.length === 0 ? (
            <p className="py-12 text-center text-lg text-neutral-500 dark:text-neutral-400" data-testid="empty-state">
              No products found
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const primaryImage = product.images[0];
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="relative block aspect-square"
                      prefetch
                    >
                      <GridTileImage
                        src={primaryImage?.url ?? ''}
                        alt={primaryImage?.alt ?? product.name}
                        label={{
                          title: product.name,
                          amount: product.price,
                          currencyCode: 'VND',
                          position: 'bottom',
                        }}
                      />
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  {page > 1 ? (
                    <Link
                      href={`/products?page=${page - 1}${params.search ? `&search=${params.search}` : ''}${params.categoryId ? `&categoryId=${params.categoryId}` : ''}`}
                      className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:border-blue-600 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-blue-500 dark:hover:text-blue-500"
                      data-testid="prev-page"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-full border border-neutral-100 px-4 py-2 text-sm text-neutral-300 dark:border-neutral-800 dark:text-neutral-600">
                      Previous
                    </span>
                  )}
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      href={`/products?page=${page + 1}${params.search ? `&search=${params.search}` : ''}${params.categoryId ? `&categoryId=${params.categoryId}` : ''}`}
                      className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:border-blue-600 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-blue-500 dark:hover:text-blue-500"
                      data-testid="next-page"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded-full border border-neutral-100 px-4 py-2 text-sm text-neutral-300 dark:border-neutral-800 dark:text-neutral-600">
                      Next
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
