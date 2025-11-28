'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@finmatter/shared';
import { useTransactions } from '@/hooks/useTransactions';
import { calculateCategorySpending, getCategoryIcon } from '@finmatter/shared';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface CategorizedSpendsWidgetProps {
  className?: string;
}

export function CategorizedSpendsWidget({
  className = '',
}: CategorizedSpendsWidgetProps) {
  const router = useRouter();
  const { transactions, isLoading } = useTransactions({
    autoFetch: true,
  });

  const categories = React.useMemo(() => {
    return calculateCategorySpending(transactions, 4);
  }, [transactions]);

  if (isLoading) {
    return (
      <div className={`px-6 ${className}`}>
        <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
          <LoadingSpinner size='sm' />
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={`px-6 ${className}`}>
      <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-white'>
            Categorized Spends
          </h3>
          <button
            onClick={() => router.push('/spending')}
            className='flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition-colors'
          >
            See All
            <ArrowRight className='w-4 h-4' />
          </button>
        </div>

        {/* Categories List */}
        <div className='space-y-4'>
          {categories.map(cat => {
            const { icon, bgColor } = getCategoryIcon(cat.category);
            return (
              <div key={cat.category} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <div
                      className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center text-white text-lg flex-shrink-0`}
                    >
                      {icon}
                    </div>
                    <span className='text-sm font-medium text-white truncate'>
                      {cat.category}
                    </span>
                  </div>
                  <span className='text-sm font-semibold text-white ml-2 flex-shrink-0'>
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className='w-full h-2 bg-gray-700 rounded-full overflow-hidden'>
                  <div
                    className={`h-full ${bgColor} rounded-full transition-all`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
