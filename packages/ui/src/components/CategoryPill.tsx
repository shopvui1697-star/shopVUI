import React from 'react';

export interface CategoryPillProps {
  category: { id: string; name: string; slug: string };
  isActive?: boolean;
  onClick?: (categoryId: string) => void;
}

export function CategoryPill({ category, isActive = false, onClick }: CategoryPillProps) {
  return (
    <button
      data-testid="category-pill"
      aria-pressed={isActive}
      onClick={() => onClick?.(category.id)}
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: 500,
        border: '1px solid #d1d5db',
        backgroundColor: isActive ? '#1f2937' : '#fff',
        color: isActive ? '#fff' : '#374151',
        cursor: 'pointer',
      }}
    >
      {category.name}
    </button>
  );
}
