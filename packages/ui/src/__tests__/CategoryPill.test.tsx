import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryPill } from '../components/CategoryPill.js';

const mockCategory = { id: 'cat-1', name: 'Electronics', slug: 'electronics' };

describe('CategoryPill', () => {
  it('renders category name', () => {
    render(<CategoryPill category={mockCategory} />);
    expect(screen.getByText('Electronics')).toBeDefined();
  });

  it('has aria-pressed="true" when isActive', () => {
    render(<CategoryPill category={mockCategory} isActive={true} />);
    expect(screen.getByTestId('category-pill').getAttribute('aria-pressed')).toBe('true');
  });

  it('has aria-pressed="false" when not active', () => {
    render(<CategoryPill category={mockCategory} isActive={false} />);
    expect(screen.getByTestId('category-pill').getAttribute('aria-pressed')).toBe('false');
  });

  it('defaults aria-pressed to "false" when isActive not provided', () => {
    render(<CategoryPill category={mockCategory} />);
    expect(screen.getByTestId('category-pill').getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onClick with categoryId when clicked', () => {
    const handleClick = vi.fn();
    render(<CategoryPill category={mockCategory} onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('category-pill'));
    expect(handleClick).toHaveBeenCalledWith('cat-1');
  });
});
