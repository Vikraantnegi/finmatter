'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@finmatter/shared';
import { RecentRewardsLoader } from './SectionLoader';

interface RecentRewardsWidgetProps {
  className?: string;
}

export function RecentRewardsWidget({
  className = '',
}: RecentRewardsWidgetProps) {
  const router = useRouter();
  const [isLoading] = React.useState(false);

  // TODO: Fetch rewards from rewards API when available
  // For now, show empty state
  const rewards: any[] = [];

  if (isLoading) {
    return <RecentRewardsLoader className={className} />;
  }

  return (
    <div className={`px-6 ${className}`}>
      <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-white'>Recent Rewards</h3>
          <button
            onClick={() => router.push('/rewards')}
            className='flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium transition-colors'
          >
            View All
            <ArrowRight className='w-3 h-3' />
          </button>
        </div>
        <div className='space-y-3'>
          {rewards.length === 0 ? (
            <p className='text-sm text-gray-400'>No recent rewards</p>
          ) : (
            rewards.map(reward => (
              <RewardItem
                key={reward.id}
                reward={reward}
                onClick={() => router.push(`/rewards/${reward.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface RewardItemProps {
  reward: any;
  onClick: () => void;
}

function RewardItem({ reward, onClick }: RewardItemProps) {
  return (
    <button
      onClick={onClick}
      className='w-full text-left flex items-center gap-3 hover:opacity-80 transition-opacity'
    >
      <div className='w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold flex-shrink-0'>
        🎁
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-white truncate'>
          {reward.title}
        </p>
        <p className='text-xs text-gray-400 truncate'>{reward.type}</p>
      </div>
      <div className='text-right flex-shrink-0'>
        <p className='text-sm font-semibold text-green-400'>
          +{formatCurrency(reward.amount)}
        </p>
      </div>
    </button>
  );
}
