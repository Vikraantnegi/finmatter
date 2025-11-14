'use client';

/**
 * Cards Page
 * Full card list with visual cards
 */

import { useEffect, useState } from 'react';
import { CardList } from '@/components/cards';
import PageHeader from '@/components/common/PageHeader';
import { AddCardFlow } from '@/components/cards/AddCardFlow';
import { useCards } from '@/hooks/useCards';

export default function CardsPage() {
  const [showAddCard, setShowAddCard] = useState(false);
  const { cards, fetchCards } = useCards();

  const handleAddCardSuccess = () => {
    setShowAddCard(false);
    fetchCards({ force: true }); // Refresh list
  };

  useEffect(() => {
    fetchCards({ force: true });
  }, [fetchCards]);

  return (
    <div className='min-h-screen bg-background-dark pb-24'>
      <PageHeader title={cards.length ? `Cards (${cards.length})` : 'Cards'} />
      <div className='container mx-auto px-4 py-6'>
        <CardList />
      </div>

      {/* Add Card Flow */}
      <AddCardFlow
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        onSuccess={handleAddCardSuccess}
      />
    </div>
  );
}
