'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface SearchBarProps {
  value?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({ value = '', onSearch, placeholder = 'Search products...', debounceMs = 300 }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSearch(newValue);
    }, debounceMs);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <input
      data-testid="search-bar"
      type="search"
      value={inputValue}
      onChange={handleChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '0.875rem',
      }}
    />
  );
}
