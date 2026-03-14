import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
}
declare function Button({ children, onClick, variant }: ButtonProps): react_jsx_runtime.JSX.Element;

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        price: number;
        compareAtPrice?: number | null;
        stockQuantity: number;
        images: {
            url: string;
            alt: string | null;
        }[];
    };
    formatPrice?: (cents: number) => string;
    onClick?: (id: string) => void;
}
declare function ProductCard({ product, formatPrice, onClick }: ProductCardProps): react_jsx_runtime.JSX.Element;

interface CategoryPillProps {
    category: {
        id: string;
        name: string;
        slug: string;
    };
    isActive?: boolean;
    onClick?: (categoryId: string) => void;
}
declare function CategoryPill({ category, isActive, onClick }: CategoryPillProps): react_jsx_runtime.JSX.Element;

interface SearchBarProps {
    value?: string;
    onSearch: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
}
declare function SearchBar({ value, onSearch, placeholder, debounceMs }: SearchBarProps): react_jsx_runtime.JSX.Element;

interface StockBadgeProps {
    stockQuantity: number;
}
declare function StockBadge({ stockQuantity }: StockBadgeProps): react_jsx_runtime.JSX.Element;

export { Button, type ButtonProps, CategoryPill, type CategoryPillProps, ProductCard, type ProductCardProps, SearchBar, type SearchBarProps, StockBadge, type StockBadgeProps };
