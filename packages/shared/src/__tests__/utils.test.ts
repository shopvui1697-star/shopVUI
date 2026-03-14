import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../utils/currency.js';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    const result = formatCurrency(1999, 'USD');
    expect(result).toBe('$19.99');
  });

  it('handles zero', () => {
    const result = formatCurrency(0, 'USD');
    expect(result).toBe('$0.00');
  });

  it('formats large amounts', () => {
    const result = formatCurrency(100000, 'USD');
    expect(result).toBe('$1,000.00');
  });
});
