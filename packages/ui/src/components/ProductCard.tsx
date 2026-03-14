import React from 'react';
import { StockBadge } from './StockBadge.js';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    stockQuantity: number;
    images: { url: string; alt: string | null }[];
  };
  formatPrice?: (cents: number) => string;
  onClick?: (id: string) => void;
}

function defaultFormatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ProductCard({ product, formatPrice = defaultFormatPrice, onClick }: ProductCardProps) {
  const primaryImage = product.images[0];

  return (
    <div
      data-testid="product-card"
      onClick={() => onClick?.(product.id)}
      role="article"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {primaryImage && (
        <img
          src={primaryImage.url}
          alt={primaryImage.alt ?? product.name}
          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
        />
      )}
      <div>
        <h3>{product.name}</h3>
        <div>
          <span data-testid="product-price">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span data-testid="compare-price" style={{ textDecoration: 'line-through', marginLeft: '8px', color: '#9ca3af' }}>
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        <StockBadge stockQuantity={product.stockQuantity} />
      </div>
    </div>
  );
}
