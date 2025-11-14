'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { CardDetailsView } from '@/components/cards/CardDetailsView';
import { EditCardBottomSheet } from '@/components/cards/EditCardBottomSheet';
import { CardLoader } from '@/components/cards/CardLoader';
import { apiClient } from '@/lib/apiClient';
import { CARD_ROUTES } from '@/constants/apiRoutes';
import { useCards } from '@/hooks/useCards';
import type { Card } from '@finmatter/types';

export default function CardDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;
  const { deleteCard } = useCards();

  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);

  const fetchCardDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{
        success: boolean;
        card: Card;
      }>(CARD_ROUTES.BY_ID(cardId));

      if (response.success && response.card) {
        setCard(response.card);
      } else {
        setError('Card not found');
      }
    } catch (err: any) {
      console.error('Error fetching card details:', err);
      setError(err.message || 'Failed to load card details');
    } finally {
      setIsLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchCardDetails();
  }, [fetchCardDetails]);

  const handleEdit = () => {
    setShowEditSheet(true);
  };

  const handleEditSuccess = async (updatedCard: Card) => {
    setCard(updatedCard);
    setShowEditSheet(false);
  };

  const handleDelete = async () => {
    try {
      await deleteCard(cardId);
      router.push('/cards');
    } catch (err) {
      console.error('Error deleting card:', err);
      // Error handling is done by apiClient (toast notifications)
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <CardLoader size='lg' />
          <p className='text-gray-400'>Loading card details...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className='min-h-screen bg-background-dark'>
        <PageHeader title='Card Details' />
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center space-y-4'>
            <p className='text-red-400'>{error || 'Card not found'}</p>
            <button
              onClick={() => router.push('/cards')}
              className='text-primary hover:text-primary/80'
            >
              Back to Cards
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cardTitle =
    card.cardMetadata?.displayName ||
    card.bank?.displayName ||
    `Card •••• ${card.lastFourDigits}`;

  return (
    <>
      <div className='min-h-screen bg-background-dark pb-24'>
        <PageHeader title={cardTitle} />
        <CardDetailsView
          card={card}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Edit Card Bottom Sheet */}
      {card && (
        <EditCardBottomSheet
          isOpen={showEditSheet}
          onClose={() => setShowEditSheet(false)}
          card={card}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
