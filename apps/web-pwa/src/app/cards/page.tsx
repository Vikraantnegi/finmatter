'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useCardStore } from '@/stores/cardStore';
import { cardService } from '@/services/cardService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CardGrid } from '@/components/cards/CardGrid';
import { PortfolioStats } from '@/components/cards/PortfolioStats';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function CardsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { cards, isLoading, setCards, setLoading, setError } = useCardStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const fetchedCards = await cardService.getCards();
      setCards(fetchedCards);
    } catch (error) {
      console.error('Error loading cards:', error);
      setError('Failed to load cards');
      toast.error('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Credit Cards</h1>
            <p className='mt-1 text-sm text-gray-500'>
              Manage your credit cards and track your spending
            </p>
          </div>
          <Button onClick={() => router.push('/cards/add')}>Add Card</Button>
        </div>

        {/* Portfolio Stats */}
        <PortfolioStats />

        {/* Cards Grid */}
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <LoadingSpinner size='lg' />
          </div>
        ) : (
          <CardGrid cards={cards} />
        )}
      </div>
    </DashboardLayout>
  );
}
