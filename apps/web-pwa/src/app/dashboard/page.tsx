'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardErrorBoundary } from '@/components/ErrorBoundary';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { NoCardsEmptyState } from '@/components/dashboard/EmptyStates';
import { CardsStackLoader } from '@/components/dashboard/SectionLoader';
import { CardsStack } from '@/components/cards/CardsStack';
import { AddCardFlow } from '@/components/cards/AddCardFlow';
import { useCards } from '@/hooks/useCards';
import { FinnyWidget } from '@/components/dashboard/FinnyWidget';
import { SpendingSummaryWidget } from '@/components/dashboard/SpendingSummaryWidget';
import { CategorizedSpendsWidget } from '@/components/dashboard/CategorizedSpendsWidget';
import { RecentTransactionsWidget } from '@/components/dashboard/RecentTransactionsWidget';
import { RecentRewardsWidget } from '@/components/dashboard/RecentRewardsWidget';
import { SpendingAnalysisWidget } from '@/components/dashboard/SpendingAnalysisWidget';

function DashboardContent() {
  const { cards, isLoading, fetchCards } = useCards();
  const [showAddCard, setShowAddCard] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleAddCardSuccess = () => {
    setShowAddCard(false);
    fetchCards({ force: true });
  };

  if (cards.length === 0 && !isLoading) {
    return (
      <>
        <div className='h-[calc(100vh-92px)] flex flex-col'>
          <DashboardHeader />
          <div className='flex-1 flex items-center justify-center px-6'>
            <NoCardsEmptyState onAddCard={() => setShowAddCard(true)} />
          </div>
        </div>
        <AddCardFlow
          isOpen={showAddCard}
          onClose={() => setShowAddCard(false)}
          onSuccess={handleAddCardSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className='flex flex-col pb-24'>
        <DashboardHeader />
        <div className='flex-1 space-y-4 pb-6'>
          {isLoading ? (
            <CardsStackLoader />
          ) : (
            <CardsStack cards={cards} onViewAll={() => router.push('/cards')} />
          )}
          <SpendingSummaryWidget />
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <CategorizedSpendsWidget />
            <SpendingAnalysisWidget />
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <RecentTransactionsWidget />
            <RecentRewardsWidget />
          </div>
          <FinnyWidget />
        </div>
      </div>
      <AddCardFlow
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        onSuccess={handleAddCardSuccess}
      />
    </>
  );
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  );
}
