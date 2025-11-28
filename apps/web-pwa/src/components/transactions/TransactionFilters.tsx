'use client';

import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
// Types imported for TypeScript only - using string literals for runtime
import type {
  TransactionDateFilter,
  TransactionSortBy,
} from '@finmatter/types';

interface FilterOption {
  label: string;
  value: string;
}

interface TransactionFiltersProps {
  dateFilter: TransactionDateFilter | string;
  onDateFilterChange: (value: TransactionDateFilter | string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  sortBy: TransactionSortBy | string;
  onSortByChange: (value: TransactionSortBy | string) => void;
  categories?: string[];
}

export function TransactionFilters({
  dateFilter,
  onDateFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
  categories = [],
}: TransactionFiltersProps) {
  // Define options inside component to avoid SSR issues with enum imports
  // Use string literals that match enum values for SSR compatibility
  const DATE_OPTIONS: FilterOption[] = React.useMemo(
    () => [
      { label: 'Last 30 Days', value: '30' }, // TransactionDateFilter.LAST_30_DAYS
      { label: 'Last 7 Days', value: '7' }, // TransactionDateFilter.LAST_7_DAYS
      { label: 'This Month', value: 'this_month' }, // TransactionDateFilter.THIS_MONTH
      { label: 'Last Month', value: 'last_month' }, // TransactionDateFilter.LAST_MONTH
      { label: 'This Year', value: 'this_year' }, // TransactionDateFilter.THIS_YEAR
      { label: 'All Time', value: 'all' }, // TransactionDateFilter.ALL_TIME
    ],
    [],
  );

  const SORT_OPTIONS: FilterOption[] = React.useMemo(
    () => [
      { label: 'Date (Newest)', value: 'date_desc' }, // TransactionSortBy.DATE_DESC
      { label: 'Date (Oldest)', value: 'date_asc' }, // TransactionSortBy.DATE_ASC
      { label: 'Amount (High to Low)', value: 'amount_desc' }, // TransactionSortBy.AMOUNT_DESC
      { label: 'Amount (Low to High)', value: 'amount_asc' }, // TransactionSortBy.AMOUNT_ASC
    ],
    [],
  );

  const [isDateOpen, setIsDateOpen] = React.useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);

  const [dateDropdownPos, setDateDropdownPos] = React.useState({
    top: 0,
    left: 0,
  });
  const [categoryDropdownPos, setCategoryDropdownPos] = React.useState({
    top: 0,
    left: 0,
  });
  const [sortDropdownPos, setSortDropdownPos] = React.useState({
    top: 0,
    right: 0,
  });

  const dateRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown positions when opened
  useEffect(() => {
    if (isDateOpen && dateRef.current) {
      const rect = dateRef.current.getBoundingClientRect();
      setDateDropdownPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isDateOpen]);

  useEffect(() => {
    if (isCategoryOpen && categoryRef.current) {
      const rect = categoryRef.current.getBoundingClientRect();
      setCategoryDropdownPos({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isCategoryOpen]);

  useEffect(() => {
    if (isSortOpen && sortRef.current) {
      const rect = sortRef.current.getBoundingClientRect();
      setSortDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isSortOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const dateLabel =
    DATE_OPTIONS.find(opt => opt.value === dateFilter)?.label || 'Date';
  const categoryLabel = categoryFilter || 'Category';
  const sortLabel =
    SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Sort By';

  return (
    <div className='flex items-center gap-2 overflow-x-auto overflow-y-visible pb-2 scrollbar-hide'>
      {/* Date Filter */}
      <div className='relative flex-shrink-0' ref={dateRef}>
        <button
          onClick={() => {
            setIsDateOpen(!isDateOpen);
            setIsCategoryOpen(false);
            setIsSortOpen(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            dateFilter !== 'all' // TransactionDateFilter.ALL_TIME
              ? 'bg-primary/20 border-primary text-primary'
              : 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
          }`}
        >
          <span className='text-sm font-medium whitespace-nowrap'>
            Date: {dateLabel}
          </span>
          <ChevronDown className='w-4 h-4' />
        </button>
        {isDateOpen && (
          <div
            className='fixed w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-[100]'
            style={{
              top: `${dateDropdownPos.top}px`,
              left: `${dateDropdownPos.left}px`,
            }}
          >
            {DATE_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onDateFilterChange(option.value);
                  setIsDateOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 first:rounded-t-xl last:rounded-b-xl ${
                  dateFilter === option.value
                    ? 'text-primary font-medium'
                    : 'text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className='relative flex-shrink-0' ref={categoryRef}>
        <button
          onClick={() => {
            setIsCategoryOpen(!isCategoryOpen);
            setIsDateOpen(false);
            setIsSortOpen(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            categoryFilter
              ? 'bg-primary/20 border-primary text-primary'
              : 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
          }`}
        >
          <span className='text-sm font-medium whitespace-nowrap'>
            {categoryLabel}
          </span>
          <ChevronDown className='w-4 h-4' />
        </button>
        {isCategoryOpen && (
          <div
            className='fixed w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-[100] max-h-64 overflow-y-auto'
            style={{
              top: `${categoryDropdownPos.top}px`,
              left: `${categoryDropdownPos.left}px`,
            }}
          >
            <button
              onClick={() => {
                onCategoryFilterChange('');
                setIsCategoryOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 rounded-t-xl ${
                !categoryFilter ? 'text-primary font-medium' : 'text-white'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  onCategoryFilterChange(category);
                  setIsCategoryOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 last:rounded-b-xl ${
                  categoryFilter === category
                    ? 'text-primary font-medium'
                    : 'text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort By */}
      <div className='relative flex-shrink-0' ref={sortRef}>
        <button
          onClick={() => {
            setIsSortOpen(!isSortOpen);
            setIsDateOpen(false);
            setIsCategoryOpen(false);
          }}
          className='flex items-center gap-2 px-4 py-2 rounded-lg border bg-gray-800 border-gray-700 text-white hover:border-gray-600 transition-colors'
        >
          <span className='text-sm font-medium whitespace-nowrap'>
            {sortLabel}
          </span>
          <ChevronDown className='w-4 h-4' />
        </button>
        {isSortOpen && (
          <div
            className='fixed w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-[100]'
            style={{
              top: `${sortDropdownPos.top}px`,
              right: `${sortDropdownPos.right}px`,
            }}
          >
            {SORT_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onSortByChange(option.value);
                  setIsSortOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 first:rounded-t-xl last:rounded-b-xl ${
                  sortBy === option.value
                    ? 'text-primary font-medium'
                    : 'text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
