import React from 'react';

export interface StockBadgeProps {
  stockQuantity: number;
}

export function StockBadge({ stockQuantity }: StockBadgeProps) {
  let label: string;
  let color: string;

  if (stockQuantity === 0) {
    label = 'Out of Stock';
    color = '#dc2626';
  } else if (stockQuantity <= 5) {
    label = 'Low Stock';
    color = '#d97706';
  } else {
    label = 'In Stock';
    color = '#16a34a';
  }

  return (
    <span
      data-testid="stock-badge"
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#fff',
        backgroundColor: color,
      }}
    >
      {label}
    </span>
  );
}
