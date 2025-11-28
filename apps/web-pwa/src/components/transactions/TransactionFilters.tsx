'use client';

import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { TransactionDateFilter, TransactionSortBy } from '@finmatter/types';

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

const DATE_OPTIONS: FilterOption[] = [
  { label: 'Last 30 Days', value: TransactionDateFilter.LAST_30_DAYS },
  { label: 'Last 7 Days', value: TransactionDateFilter.LAST_7_DAYS },
  { label: 'This Month', value: TransactionDateFilter.THIS_MONTH },
  { label: 'Last Month', value: TransactionDateFilter.LAST_MONTH },
  { label: 'This Year', value: TransactionDateFilter.THIS_YEAR },
  { label: 'All Time', value: TransactionDateFilter.ALL_TIME },
];

const SORT_OPTIONS: FilterOption[] = [
  { label: 'Date (Newest)', value: TransactionSortBy.DATE_DESC },
  { label: 'Date (Oldest)', value: TransactionSortBy.DATE_ASC },
  { label: 'Amount (High to Low)', value: TransactionSortBy.AMOUNT_DESC },
  { label: 'Amount (Low to High)', value: TransactionSortBy.AMOUNT_ASC },
];

export function TransactionFilters({
  dateFilter,
  onDateFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
  categories = [],
}: TransactionFiltersProps) {
  const [isDateOpen, setIsDateOpen] = React.useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);

  const dateRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

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
    <div className='flex items-center gap-2 overflow-x-auto pb-2'>
      {/* Date Filter */}
      <div className='relative flex-shrink-0' ref={dateRef}>
        <button
          onClick={() => {
            setIsDateOpen(!isDateOpen);
            setIsCategoryOpen(false);
            setIsSortOpen(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            dateFilter !== TransactionDateFilter.ALL_TIME
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
          <div className='absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50'>
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
          <div className='absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto'>
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
          <div className='absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50'>
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
