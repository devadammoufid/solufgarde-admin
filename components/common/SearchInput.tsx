// components/common/SearchInput.tsx - Search Input Component
'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  clearable?: boolean;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  debounceMs = 300,
  clearable = true,
  className,
}) => {
  const [searchValue, setSearchValue] = useState(value);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch && searchValue !== value) {
        onSearch(searchValue);
      }
      if (onChange) {
        onChange(searchValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, onSearch, onChange, value]);

  // Update internal state when external value changes
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const handleClear = () => {
    setSearchValue('');
    if (onChange) onChange('');
    if (onSearch) onSearch('');
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className={cn(
          'pl-10',
          clearable && searchValue && 'pr-10'
        )}
      />
      {clearable && searchValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 hover:bg-muted"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};