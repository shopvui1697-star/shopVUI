import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StockBadge } from '../components/StockBadge.js';

describe('StockBadge', () => {
  it('shows "In Stock" when stockQuantity > 5', () => {
    render(<StockBadge stockQuantity={10} />);
    expect(screen.getByTestId('stock-badge').textContent).toBe('In Stock');
  });

  it('shows "Low Stock" when stockQuantity is between 1 and 5', () => {
    render(<StockBadge stockQuantity={3} />);
    expect(screen.getByTestId('stock-badge').textContent).toBe('Low Stock');
  });

  it('shows "Low Stock" when stockQuantity is exactly 5', () => {
    render(<StockBadge stockQuantity={5} />);
    expect(screen.getByTestId('stock-badge').textContent).toBe('Low Stock');
  });

  it('shows "Out of Stock" when stockQuantity is 0', () => {
    render(<StockBadge stockQuantity={0} />);
    expect(screen.getByTestId('stock-badge').textContent).toBe('Out of Stock');
  });
});
