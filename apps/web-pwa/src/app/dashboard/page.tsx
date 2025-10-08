'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useCardStore } from '@/stores/cardStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CardGrid } from '@/components/cards/CardGrid';
import { PortfolioStats } from '@/components/cards/PortfolioStats';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuthStore();
  const { cards, isLoading: cardsLoading } = useCardStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        {/* Welcome Section */}
        <div className='bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white'>
          <h1 className='text-2xl font-bold mb-2'>
            Welcome back, {user?.profileData?.firstName || 'User'}! 👋
          </h1>
          <p className='text-primary-100'>
            Here&apos;s your credit card portfolio overview
          </p>
        </div>

        {/* Portfolio Stats */}
        <PortfolioStats />

        {/* Cards Section */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-gray-900'>Your Cards</h2>
            <button
              onClick={() => router.push('/cards/add')}
              className='btn btn-primary'
            >
              Add Card
            </button>
          </div>

          {cardsLoading ? (
            <div className='flex justify-center py-8'>
              <LoadingSpinner size='md' />
            </div>
          ) : cards.length > 0 ? (
            <CardGrid cards={cards} />
          ) : (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
                <svg
                  className='mx-auto h-12 w-12'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1}
                    d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No cards added yet
              </h3>
              <p className='text-gray-500 mb-6'>
                Add your first credit card to start tracking your expenses and
                optimizing rewards.
              </p>
              <button
                onClick={() => router.push('/cards/add')}
                className='btn btn-primary'
              >
                Add Your First Card
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
