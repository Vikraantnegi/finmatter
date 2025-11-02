'use client';

import React from 'react';
import { DashboardErrorBoundary } from '@/components/ErrorBoundary';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { NoCardsEmptyState } from '@/components/dashboard/EmptyStates';

function DashboardContent() {
  // TODO: Add loading state when fetching data
  // TODO: Add condition to check if user has cards

  // Currently showing empty state by default
  return (
    <div className='min-h-screen flex flex-col'>
      <DashboardHeader />
      <div className='flex-1 flex items-center justify-center px-6'>
        <NoCardsEmptyState />
      </div>
    </div>
  );

  // Future: Main dashboard with cards
  // return (
  //   <div className='space-y-6 pb-6'>
  //     <DashboardHeader />
  //     <CardsStack cards={cards} />
  //     <SpendingAnalysis />
  //     <RecentTransactions />
  //     <RewardsWidget />
  //     <FinnyWidget />
  //   </div>
  // );
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  );
}
