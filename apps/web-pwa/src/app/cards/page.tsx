'use client';

import { useEffect, useState } from 'react';
import { CardList } from '@/components/cards';
import { AddCardFlow } from '@/components/cards/AddCardFlow';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { useCards } from '@/hooks/useCards';

export default function CardsPage() {
  const [showAddCard, setShowAddCard] = useState(false);
  const { cards, fetchCards } = useCards();

  const handleAddCardSuccess = () => {
    setShowAddCard(false);
    fetchCards({ force: true });
  };

  useEffect(() => {
    fetchCards({ force: true });
  }, [fetchCards]);

  return (
    <div className='min-h-screen bg-background-dark flex flex-col'>
      <div className='flex-1 py-6'>
        <div className='mb-4 text-white font-semibold text-lg mx-auto'>
          <span>{cards.length ? `Cards (${cards.length})` : 'Cards'}</span>
        </div>
        <CardList />
      </div>
      <BottomNavigation />
      <AddCardFlow
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        onSuccess={handleAddCardSuccess}
      />
    </div>
  );
}
