'use client';

import { useRouter } from 'next/navigation';
import { useAuth, useCards } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { CardVisual } from '@/components/cards/CardVisual';
import { UtilizationAlert } from '@/components/cards/UtilizationAlert';
import { DashboardErrorBoundary } from '@/components/ErrorBoundary';
import { SpendingAlerts } from '@/components/transactions/SpendingAlerts';
import { TransactionInsights } from '@/components/transactions/TransactionInsights';
import { CreditCard, Plus, AlertCircle } from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cards,
    isLoading: loading,
    totalCards,
    highUtilizationCards,
  } = useCards();

  if (loading) {
    return (
      <div className='min-h-screen bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='mb-8'>
            <div className='h-8 w-48 bg-gray-200 rounded animate-pulse mb-2'></div>
            <div className='h-4 w-64 bg-gray-200 rounded animate-pulse'></div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <div className='h-12 w-12 bg-gray-200 rounded-lg animate-pulse mb-4'></div>
                <div className='h-8 w-20 bg-gray-200 rounded animate-pulse mb-2'></div>
                <div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Welcome Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Welcome back, {user?.profileData?.firstName || 'User'}!
          </h1>
          <p className='text-gray-600 mt-2'>
            Here&apos;s an overview of your credit card portfolio
          </p>
        </div>

        {/* Credit Utilization Alert */}
        {totalCards > 0 && <UtilizationAlert cards={cards} className='mb-8' />}

        {/* Transaction Insights - Only show if user has cards */}
        {totalCards > 0 && <TransactionInsights className='mb-8' />}

        {/* Spending Alerts - Only show if user has cards */}
        {totalCards > 0 && <SpendingAlerts className='mb-8' />}

        {/* Your Cards */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Your Cards</h2>
              <p className='text-sm text-gray-600 mt-1'>
                {totalCards === 0
                  ? 'Add your first credit card to start tracking'
                  : `You have ${totalCards} card${totalCards > 1 ? 's' : ''} in your portfolio`}
              </p>
            </div>
          </div>

          {cards.length === 0 ? (
            <div className='text-center py-12'>
              <CreditCard className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No cards yet
              </h3>
              <p className='text-gray-600 mb-6'>
                Add your first credit card to start tracking rewards and
                benefits
              </p>
              <Button onClick={() => router.push('/cards/add')}>
                <Plus className='w-4 h-4 mr-2' />
                Add Your First Card
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {cards.slice(0, 3).map(card => (
                <div
                  key={card.id}
                  onClick={() => router.push(`/cards/${card.id}`)}
                  className='cursor-pointer transform transition-transform hover:scale-105'
                >
                  <CardVisual card={card} showDetails={false} />
                </div>
              ))}
              <div className='flex items-center gap-3 ml-auto'>
                <Button variant='outline' onClick={() => router.push('/cards')}>
                  View All
                </Button>
                <Button onClick={() => router.push('/cards/add')}>
                  <Plus className='w-4 h-4 mr-2' />
                  Add Card
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* High Utilization Alert */}
        {highUtilizationCards.length > 0 && (
          <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8'>
            <div className='flex items-start space-x-3'>
              <AlertCircle className='w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5' />
              <div>
                <h3 className='font-semibold text-yellow-900 mb-1'>
                  High Credit Utilization Alert
                </h3>
                <p className='text-sm text-yellow-800 mb-3'>
                  {highUtilizationCards.length} card
                  {highUtilizationCards.length > 1 ? 's have' : ' has'} high
                  utilization (&gt;70%). Consider paying down balances to
                  improve your credit score.
                </p>
                <div className='flex flex-wrap gap-2'>
                  {highUtilizationCards.map(card => (
                    <span
                      key={card.id}
                      className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'
                    >
                      {card.cardName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  );
}
