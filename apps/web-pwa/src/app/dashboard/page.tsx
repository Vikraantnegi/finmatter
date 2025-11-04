'use client';

import React, { useEffect, useState } from 'react';
import { DashboardErrorBoundary } from '@/components/ErrorBoundary';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { NoCardsEmptyState } from '@/components/dashboard/EmptyStates';
import { DashboardLoader } from '@/components/dashboard/SectionLoader';
import { CardsStack } from '@/components/cards/CardsStack';
import { PortfolioStats } from '@/components/dashboard/PortfolioStats';
import { AddCardFlow } from '@/components/cards/AddCardFlow';
import { useCards } from '@/hooks/useCards';

function DashboardContent() {
  const { cards, isLoading, fetchCards } = useCards();
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleAddCardSuccess = () => {
    setShowAddCard(false);
    fetchCards(); // Refresh cards
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex flex-col'>
        <DashboardHeader />
        <DashboardLoader />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <>
        <div className='min-h-screen flex flex-col'>
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
      <div className='min-h-screen flex flex-col pb-24'>
        <DashboardHeader />
        <div className='flex-1 space-y-6 pb-6'>
          <CardsStack cards={cards} />
          <PortfolioStats cards={cards} />
          {/* Future components will go here:
          <SpendingAnalysis />
          <RecentTransactions />
          <RewardsWidget />
          <FinnyWidget />
          */}
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
