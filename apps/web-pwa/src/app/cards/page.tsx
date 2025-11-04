'use client';

/**
 * Cards Page
 * Full card list with visual cards
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CardList } from '@/components/cards';
import PageHeader from '@/components/common/PageHeader';
import { AddCardFlow } from '@/components/cards/AddCardFlow';
import { useCards } from '@/hooks/useCards';
import { Button } from '@/components/ui/Button';

export default function CardsPage() {
  const [showAddCard, setShowAddCard] = useState(false);
  const { fetchCards } = useCards();

  const handleAddCardSuccess = () => {
    setShowAddCard(false);
    fetchCards(); // Refresh list
  };

  return (
    <div className='min-h-screen bg-background-dark pb-24'>
      <PageHeader
        title='Cards'
        action={
          <Button
            onClick={() => setShowAddCard(true)}
            className='bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-4 py-2'
            size='sm'
          >
            <Plus className='w-4 h-4 mr-1.5' />
            Add Card
          </Button>
        }
      />
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
