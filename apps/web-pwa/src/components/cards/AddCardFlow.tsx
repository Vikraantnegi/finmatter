'use client';

/**
 * Add Card Flow Component
 * Orchestrates the entire add card flow:
 * 1. Add Card BottomSheet -> User enters details -> BIN lookup
 * 2. Card Flipping Loader (shown during API call)
 * 3. Card Successfully Added BottomSheet with Card Preview
 */

import { useState } from 'react';
import { AddCardBottomSheet, CardSuccessBottomSheet } from './index';
import type { Card } from '@finmatter/types';

interface AddCardFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (card: Card) => void; // Optional callback when card is added
}

export const AddCardFlow = ({
  isOpen,
  onClose,
  onSuccess,
}: AddCardFlowProps) => {
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [addedCard, setAddedCard] = useState<Card | null>(null);

  const handleCardAdded = (card: Card) => {
    setAddedCard(card);
    setShowSuccessSheet(true);
    // Don't call onSuccess here - wait until success sheet closes
  };

  const handleSuccessContinue = () => {
    setShowSuccessSheet(false);
    const card = addedCard;
    setAddedCard(null);
    onClose();
    // Refresh cards when success sheet closes
    if (card) {
      onSuccess?.(card);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessSheet(false);
    const card = addedCard;
    setAddedCard(null);
    onClose();
    // Refresh cards when success sheet closes
    if (card) {
      onSuccess?.(card);
    }
  };

  return (
    <>
      {/* Add Card BottomSheet */}
      <AddCardBottomSheet
        isOpen={isOpen && !showSuccessSheet}
        onClose={onClose}
        onSuccess={handleCardAdded}
      />

      {/* Success BottomSheet */}
      {addedCard && (
        <CardSuccessBottomSheet
          isOpen={showSuccessSheet}
          onClose={handleSuccessClose}
          onContinue={handleSuccessContinue}
          card={addedCard}
        />
      )}
    </>
  );
};
