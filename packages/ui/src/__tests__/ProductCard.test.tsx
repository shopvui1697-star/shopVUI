import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard.js';

const mockProduct = {
  id: 'prod-1',
  name: 'Test Product',
  price: 2999,
  compareAtPrice: null,
  stockQuantity: 10,
  images: [{ url: 'https://example.com/img.jpg', alt: 'Test image' }],
};

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeDefined();
  });

  it('renders formatted price', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByTestId('product-price').textContent).toBe('$29.99');
  });

  it('shows compare-at price with line-through when set', () => {
    const productWithCompare = { ...mockProduct, compareAtPrice: 3999 };
    render(<ProductCard product={productWithCompare} />);

    const comparePrice = screen.getByTestId('compare-price');
    expect(comparePrice.textContent).toBe('$39.99');
    expect(comparePrice.style.textDecoration).toBe('line-through');
  });

  it('does not show compare-at price when not set', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.queryByTestId('compare-price')).toBeNull();
  });

  it('shows StockBadge with "In Stock" when stockQuantity > 5', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByTestId('stock-badge').textContent).toBe('In Stock');
  });

  it('shows StockBadge with "Out of Stock" when stockQuantity is 0', () => {
    const outOfStock = { ...mockProduct, stockQuantity: 0 };
    render(<ProductCard product={outOfStock} />);
    expect(screen.getByTestId('stock-badge').textContent).toBe('Out of Stock');
  });

  it('calls onClick with product id when clicked', () => {
    const handleClick = vi.fn();
    render(<ProductCard product={mockProduct} onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('product-card'));
    expect(handleClick).toHaveBeenCalledWith('prod-1');
  });

  it('uses custom formatPrice when provided', () => {
    const customFormat = (cents: number) => `${cents} cents`;
    render(<ProductCard product={mockProduct} formatPrice={customFormat} />);
    expect(screen.getByTestId('product-price').textContent).toBe('2999 cents');
  });
});
