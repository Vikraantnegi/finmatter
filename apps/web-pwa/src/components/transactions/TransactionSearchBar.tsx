'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface TransactionSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TransactionSearchBar({
  value,
  onChange,
  placeholder = 'Search by merchant, category...',
}: TransactionSearchBarProps) {
  return (
    <div className='relative'>
      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
      <input
        type='text'
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
      />
    </div>
  );
}
