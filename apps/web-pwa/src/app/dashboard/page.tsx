'use client';

import React from 'react';
import { DashboardErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CardsStack } from '@/components/dashboard/CardsStack';
import { SpendingAnalysis } from '@/components/dashboard/SpendingAnalysis';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { RewardsWidget } from '@/components/dashboard/RewardsWidget';
import { FinnyWidget } from '@/components/dashboard/FinnyWidget';
import { NoCardsEmptyState } from '@/components/dashboard/EmptyStates';
import { useCards } from '@/hooks/useCards';
import { DashboardLoader } from '@/components/dashboard/SectionLoader';

function DashboardContent() {
  const { cards, isLoading } = useCards();

  // Show loader while fetching data
  if (isLoading) {
    return (
      <div className='pt-4'>
        <DashboardLoader />
      </div>
    );
  }

  // No cards - show empty state
  if (cards.length === 0) {
    return (
      <div className='min-h-screen flex flex-col'>
        <DashboardHeader />
        <div className='flex-1 flex items-center justify-center px-6'>
          <NoCardsEmptyState />
        </div>
      </div>
    );
  }

  // Main dashboard with cards
  return (
    <div className='space-y-6 pb-6'>
      {/* Header */}
      <DashboardHeader />

      {/* Cards Stack */}
      <CardsStack cards={cards} />

      {/* Spending Analysis */}
      <SpendingAnalysis />

      {/* Recent Transactions */}
      <RecentTransactions />

      {/* Rewards Widget */}
      <RewardsWidget />

      {/* AI Assistant Widget */}
      <FinnyWidget />
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
