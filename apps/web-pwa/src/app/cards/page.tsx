'use client';

/**
 * Cards Page
 * Placeholder page for card list
 */

import { CardList } from '@/components/cards';
import PageHeader from '@/components/common/PageHeader';

export default function CardsPage() {
  return (
    <div className='min-h-screen bg-background-dark'>
      <PageHeader title='Cards' />
      <div className='container mx-auto px-4 py-6'>
        <CardList />
      </div>
    </div>
  );
}
