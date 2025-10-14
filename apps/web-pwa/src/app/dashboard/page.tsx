'use client';

// import { useEffect } from 'react'; // Removed since we're not using useEffect anymore
import { useRouter } from 'next/navigation';
import { useAuth, useCards } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { CardVisual } from '@/components/cards/CardVisual';
import { UtilizationAlert } from '@/components/cards/UtilizationAlert';
import {
  CreditCard,
  Plus,
  TrendingUp,
  Wallet,
  AlertCircle,
} from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cards,
    isLoading: loading,
    totalCards,
    totalCreditLimit,
    totalUtilizedAmount,
    averageUtilization,
    highUtilizationCards,
  } = useCards();

  // Calculate derived stats
  const totalAvailable = totalCreditLimit - totalUtilizedAmount;

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50'>
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
    <div className='min-h-screen bg-gray-50'>
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
        <UtilizationAlert cards={cards} className='mb-8' />

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
                <CreditCard className='w-6 h-6 text-primary-600' />
              </div>
            </div>
            <div className='text-2xl font-bold text-gray-900'>{totalCards}</div>
            <div className='text-sm text-gray-600'>Total Cards</div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Wallet className='w-6 h-6 text-blue-600' />
              </div>
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              ₹{totalCreditLimit.toLocaleString()}
            </div>
            <div className='text-sm text-gray-600'>Total Limit</div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-green-600' />
              </div>
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              ₹{totalAvailable.toLocaleString()}
            </div>
            <div className='text-sm text-gray-600'>Available Credit</div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  averageUtilization > 70
                    ? 'bg-red-100'
                    : averageUtilization > 50
                      ? 'bg-yellow-100'
                      : 'bg-green-100'
                }`}
              >
                <AlertCircle
                  className={`w-6 h-6 ${
                    averageUtilization > 70
                      ? 'text-red-600'
                      : averageUtilization > 50
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                />
              </div>
            </div>
            <div
              className={`text-2xl font-bold ${
                averageUtilization > 70
                  ? 'text-red-600'
                  : averageUtilization > 50
                    ? 'text-yellow-600'
                    : 'text-green-600'
              }`}
            >
              {averageUtilization.toFixed(1)}%
            </div>
            <div className='text-sm text-gray-600'>Avg Utilization</div>
          </div>
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

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <button
            onClick={() => router.push('/cards/add')}
            className='bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 hover:border-primary-400 hover:bg-primary-50 transition-colors text-center'
          >
            <Plus className='w-8 h-8 text-gray-400 mx-auto mb-3' />
            <div className='font-medium text-gray-900'>Add New Card</div>
            <div className='text-sm text-gray-600 mt-1'>
              Track another credit card
            </div>
          </button>

          <button
            onClick={() => router.push('/statements')}
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center'
          >
            <TrendingUp className='w-8 h-8 text-primary-600 mx-auto mb-3' />
            <div className='font-medium text-gray-900'>Upload Statement</div>
            <div className='text-sm text-gray-600 mt-1'>
              Analyze your spending
            </div>
          </button>

          <button
            onClick={() => router.push('/cards')}
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center'
          >
            <CreditCard className='w-8 h-8 text-primary-600 mx-auto mb-3' />
            <div className='font-medium text-gray-900'>View All Cards</div>
            <div className='text-sm text-gray-600 mt-1'>
              Manage your portfolio
            </div>
          </button>
        </div>

        {/* Recent Cards */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold text-gray-900'>Your Cards</h2>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push('/cards')}
            >
              View All
            </Button>
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
                  <CardVisual card={card} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
