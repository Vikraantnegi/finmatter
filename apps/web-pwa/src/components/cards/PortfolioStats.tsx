'use client';

import { useCardStore } from '@/stores/cardStore';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export function PortfolioStats() {
  const {
    getTotalLimit,
    getTotalUsed,
    getTotalAvailable,
    getAverageUtilization,
  } = useCardStore();

  const totalLimit = getTotalLimit();
  const totalUsed = getTotalUsed();
  const totalAvailable = getTotalAvailable();
  const avgUtilization = getAverageUtilization();

  const stats = [
    {
      name: 'Total Limit',
      value: formatCurrency(totalLimit),
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: '💰',
    },
    {
      name: 'Total Used',
      value: formatCurrency(totalUsed),
      change: '+5.4%',
      changeType: 'negative' as const,
      icon: '💳',
    },
    {
      name: 'Available Credit',
      value: formatCurrency(totalAvailable),
      change: '+1.2%',
      changeType: 'positive' as const,
      icon: '✅',
    },
    {
      name: 'Avg Utilization',
      value: formatPercentage(avgUtilization),
      change: avgUtilization > 30 ? 'High' : 'Good',
      changeType:
        avgUtilization > 30 ? ('negative' as const) : ('positive' as const),
      icon: '📊',
    },
  ];

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {stats.map(stat => (
        <div key={stat.name} className='card'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <span className='text-2xl'>{stat.icon}</span>
            </div>
            <div className='ml-4 flex-1'>
              <p className='text-sm font-medium text-gray-600'>{stat.name}</p>
              <p className='text-2xl font-semibold text-gray-900'>
                {stat.value}
              </p>
            </div>
            <div className='flex-shrink-0'>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  stat.changeType === 'positive'
                    ? 'bg-success-100 text-success-800'
                    : 'bg-error-100 text-error-800'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
