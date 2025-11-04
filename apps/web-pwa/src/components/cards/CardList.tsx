'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { CardGridItem } from './CardGridItem';
import { AddCardFlow } from './AddCardFlow';
import { EmptyState } from '@/components/dashboard/EmptyStates';
import { CardsStackLoader } from '@/components/dashboard/SectionLoader';
import { useCards } from '@/hooks/useCards';

export const CardList = () => {
  const { cards, isLoading, fetchCards } = useCards();
  const [showAddCard, setShowAddCard] = useState(false);

  const handleAddCardSuccess = () => {
    setShowAddCard(false);
    fetchCards(); // Refresh list
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <CardsStackLoader />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <>
        <EmptyState
          title='No Cards Added Yet'
          description='Add your first card to unlock app features and start tracking your spending.'
          actionLabel='Add Card'
          onAction={() => setShowAddCard(true)}
          illustration='cards'
        />
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
      <div className='space-y-6 pb-24'>
        {/* Grid Layout */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {cards.map(card => (
            <CardGridItem key={card.id} card={card} />
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddCard(true)}
        className='fixed bottom-24 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all'
      >
        <Plus className='w-6 h-6' />
      </motion.button>

      {/* Add Card Flow */}
      <AddCardFlow
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        onSuccess={handleAddCardSuccess}
      />
    </>
  );
};
