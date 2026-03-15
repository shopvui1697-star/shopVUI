import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getProduct, getPriceTiers, getProducts } from '../../../lib/api';
import { formatCurrency } from '@shopvui/shared';
import { GridTileImage } from '../../../components/grid/tile';
import { Footer } from '../../../components/layout/footer';
import { PriceTierTable } from '../../../components/PriceTierTable';
import { AddToCartButton } from '../../../components/AddToCartButton';
import { WishlistButton } from '../../../components/WishlistButton';
import { NotifyAdminButton } from '../../../components/NotifyAdminButton';
import { ProductGallery } from '../../../components/ProductGallery';
import { ReviewSection } from '../../../components/reviews/ReviewSection';
import { findFirstImage } from '../../../lib/media';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    const t = await getTranslations('products');
    return { title: t('productNotFound') };
  }

  const primaryImage = findFirstImage(product.images);

  return {
    title: `${product.name} - ShopVUI`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'website',
      ...(primaryImage && {
        images: [{ url: primaryImage.url, alt: primaryImage.alt ?? product.name }],
      }),
    },
  };
}

function StockBadge({ stockQuantity, labels }: { stockQuantity: number; labels: { outOfStock: string; lowStock: string; inStock: string } }) {
  if (stockQuantity <= 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        {labels.outOfStock}
      </span>
    );
  }
  if (stockQuantity <= 10) {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        {labels.lowStock}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
      {labels.inStock}
    </span>
  );
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const [product, tiers, t] = await Promise.all([getProduct(id), getPriceTiers(id), getTranslations('products')]);

  if (!product) {
    notFound();
  }

  const relatedProductsData = await getProducts({ categoryId: product.categoryId, pageSize: 4 });
  const relatedProducts = relatedProductsData.data.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <>
      <div className="mx-auto max-w-screen-2xl px-4 pb-4">
        <Link
          href="/products"
          className="mb-4 inline-flex items-center text-sm text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-white"
        >
          {t('backToProducts')}
        </Link>

        <div className="flex flex-col gap-8 md:flex-row">
          {/* Image / Video Gallery */}
          <div className="w-full md:w-4/6">
            <ProductGallery
              images={product.images}
              productName={product.name}
              noImageLabel={t('noImage')}
            />
          </div>

          {/* Product Info */}
          <div className="w-full md:w-2/6">
            {product.category && (
              <p
                className="mb-2 text-sm text-neutral-500 dark:text-neutral-400"
                data-testid="category-breadcrumb"
              >
                {product.category.name}
              </p>
            )}

            <h1
              className="mb-2 text-3xl font-bold text-black dark:text-white"
              data-testid="product-name"
            >
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <span
                className="inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                data-testid="product-price"
              >
                {formatCurrency(product.price, 'VND')}
              </span>
              {product.compareAtPrice && (
                <span
                  className="text-lg text-neutral-400 line-through"
                  data-testid="compare-price"
                >
                  {formatCurrency(product.compareAtPrice, 'VND')}
                </span>
              )}
            </div>

            <div className="mt-4">
              <StockBadge stockQuantity={product.stockQuantity} labels={{ outOfStock: t('outOfStock'), lowStock: t('lowStock', { count: String(product.stockQuantity) }), inStock: t('inStock') }} />
            </div>

            {tiers.length > 0 && (
              <div className="mt-6">
                <PriceTierTable tiers={tiers} />
              </div>
            )}

            <div className="mt-6 space-y-3">
              <AddToCartButton productId={product.id} inStock={product.stockQuantity > 0} />
              <WishlistButton productId={product.id} initialInWishlist={false} slug={id} />
              <NotifyAdminButton productId={product.id} productName={product.name} />
            </div>

            <div className="mt-6 border-t border-neutral-200 pt-6 dark:border-neutral-800">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t('description')}
              </h2>
              <div
                className="prose prose-sm max-w-none text-neutral-600 dark:prose-invert dark:text-neutral-300"
                data-testid="product-description"
              >
                <p>{product.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <ReviewSection productId={product.id} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-4 text-2xl font-bold text-black dark:text-white">
              {t('relatedProducts')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((rp) => {
                const rpImage = findFirstImage(rp.images);
                return (
                  <Link
                    key={rp.id}
                    href={`/products/${rp.id}`}
                    className="relative block aspect-square"
                    prefetch
                  >
                    <GridTileImage
                      src={rpImage?.url ?? ''}
                      alt={rpImage?.alt ?? rp.name}
                      label={{
                        title: rp.name,
                        amount: rp.price,
                        currencyCode: 'VND',
                        position: 'bottom',
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
