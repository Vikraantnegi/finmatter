'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CardVisual } from '@/components/cards/CardVisual';
import { Modal } from '@/components/ui/Modal';
import { useCardStore } from '@/stores/cardStore';
import { cardService } from '@/services/cardService';
import type {
  CardBenefitResponse,
  CardMetadataResponse,
} from '@finmatter/types';
import { Card } from '@finmatter/types';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Gift,
  Calendar,
  CreditCard as CreditCardIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;

  const { cards, isLoading: loading, fetchCards, deleteCard } = useCardStore();
  const [card, setCard] = useState<Card | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [benefits, setBenefits] = useState<CardBenefitResponse[]>([]);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [cardMetadata, setCardMetadata] = useState<CardMetadataResponse | null>(
    null,
  );

  // Fetch card details
  useEffect(() => {
    if (!cards.length) {
      fetchCards();
    } else {
      const foundCard = cards.find(c => c.id === cardId);
      setCard(foundCard || null);
    }
  }, [cardId, cards, fetchCards]);

  // Fetch benefits from database
  useEffect(() => {
    const fetchBenefits = async () => {
      if (!card) return;

      setBenefitsLoading(true);
      try {
        // Fetch benefits and metadata from database API
        const { benefits: dbBenefits, metadata } =
          await cardService.getCardBenefitsWithMetadata(card.id);

        if (dbBenefits.length > 0) {
          setBenefits(dbBenefits);
          setCardMetadata(metadata || null);
        } else {
          // No benefits found in database
          setBenefits([]);
        }
      } catch (error) {
        console.error('Error fetching benefits:', error);
        setBenefits([]);
      } finally {
        setBenefitsLoading(false);
      }
    };

    fetchBenefits();
  }, [card]);

  const handleEdit = () => {
    router.push(`/cards/${cardId}/edit`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCard(cardId);
      toast.success('Card deleted successfully');
      router.push('/cards');
    } catch (error) {
      // Error handled by toast
      toast.error('Failed to delete card');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading || !card) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 sticky top-0 z-30'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between py-4'>
            <div className='flex items-center'>
              <button
                onClick={() => router.back()}
                className='mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <ArrowLeft className='w-5 h-5 text-gray-600' />
              </button>
              <h1 className='text-xl font-bold text-gray-900'>Card Details</h1>
            </div>
            <div className='flex space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleEdit}
                className='flex items-center space-x-2'
              >
                <Edit className='w-4 h-4' />
                <span>Edit</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowDeleteModal(true)}
                className='flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50'
              >
                <Trash2 className='w-4 h-4' />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
        {/* Card Visual */}
        <CardVisual card={card} showDetails={false} />

        {/* Card Stats */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Card Information
          </h2>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <div className='text-sm text-gray-600 mb-1'>Credit Limit</div>
              <div className='text-xl font-bold text-gray-900'>
                ₹{card.creditLimit?.toLocaleString() || '0'}
              </div>
            </div>
            <div>
              <div className='text-sm text-gray-600 mb-1'>Available Credit</div>
              <div className='text-xl font-bold text-green-600'>
                ₹{card.availableCredit?.toLocaleString() || '0'}
              </div>
            </div>
            <div>
              <div className='text-sm text-gray-600 mb-1'>Used Credit</div>
              <div className='text-xl font-bold text-red-600'>
                ₹
                {card.creditLimit && card.availableCredit
                  ? (card.creditLimit - card.availableCredit).toLocaleString()
                  : '0'}
              </div>
            </div>
            <div>
              <div className='text-sm text-gray-600 mb-1'>Utilization</div>
              <div className='text-xl font-bold text-gray-900'>
                {card.creditLimit && card.availableCredit
                  ? (
                      ((card.creditLimit - card.availableCredit) /
                        card.creditLimit) *
                      100
                    ).toFixed(1)
                  : '0'}
                %
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className='mt-6 pt-6 border-t border-gray-200 space-y-3'>
            {card.billingDay && (
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2 text-gray-600'>
                  <Calendar className='w-4 h-4' />
                  <span className='text-sm'>Billing Day</span>
                </div>
                <span className='font-medium'>{card.billingDay}</span>
              </div>
            )}
            {card.expiryDate && (
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2 text-gray-600'>
                  <CreditCardIcon className='w-4 h-4' />
                  <span className='text-sm'>Expiry Date</span>
                </div>
                <span className='font-medium'>
                  {new Date(card.expiryDate).toLocaleDateString('en-GB', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {card.rewardType && (
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2 text-gray-600'>
                  <Gift className='w-4 h-4' />
                  <span className='text-sm'>Reward Type</span>
                </div>
                <span className='font-medium capitalize'>
                  {card.rewardType}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card Metadata Information */}
        {cardMetadata && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Card Details
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-500'>
                  Card Type
                </label>
                <p className='text-gray-900 capitalize'>
                  {cardMetadata.cardType}
                </p>
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-500'>
                  Network
                </label>
                <p className='text-gray-900 capitalize'>
                  {cardMetadata.network}
                </p>
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-500'>
                  Reward Type
                </label>
                <p className='text-gray-900 capitalize'>
                  {cardMetadata.rewardType}
                </p>
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-500'>
                  Annual Fee
                </label>
                <p className='text-gray-900'>
                  ₹{cardMetadata.annualFee.toLocaleString()}
                </p>
              </div>
              {cardMetadata.primaryColor && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-500'>
                    Card Colors
                  </label>
                  <div className='flex items-center space-x-2'>
                    <div
                      className='w-6 h-6 rounded border border-gray-300'
                      style={{ backgroundColor: cardMetadata.primaryColor }}
                    />
                    {cardMetadata.secondaryColor && (
                      <div
                        className='w-6 h-6 rounded border border-gray-300'
                        style={{ backgroundColor: cardMetadata.secondaryColor }}
                      />
                    )}
                  </div>
                </div>
              )}
              {cardMetadata.description && (
                <div className='space-y-2 md:col-span-2 lg:col-span-3'>
                  <label className='text-sm font-medium text-gray-500'>
                    Description
                  </label>
                  <p className='text-gray-900'>{cardMetadata.description}</p>
                </div>
              )}
              {cardMetadata.rewardRules &&
                Object.keys(cardMetadata.rewardRules).length > 0 && (
                  <div className='space-y-2 md:col-span-2 lg:col-span-3'>
                    <label className='text-sm font-medium text-gray-500'>
                      Reward Rules
                    </label>
                    <div className='space-y-2'>
                      {Object.entries(cardMetadata.rewardRules).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className='flex justify-between text-sm'
                          >
                            <span className='text-gray-600 capitalize'>
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className='text-gray-900'>
                              {String(value)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Custom Benefits */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Card Benefits
            </h2>
            <div className='flex items-center space-x-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() =>
                  toast('Statement upload feature coming soon!', { icon: 'ℹ️' })
                }
                className='flex items-center space-x-2'
              >
                <CreditCardIcon className='w-4 h-4' />
                <span>Upload Statement</span>
              </Button>
            </div>
          </div>

          {benefitsLoading ? (
            <div className='text-center py-8'>
              <LoadingSpinner size='md' />
              <p className='text-gray-500 mt-2'>Loading benefits...</p>
            </div>
          ) : benefits && benefits.length > 0 ? (
            <div className='space-y-3'>
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.id || index}
                  className='flex items-start p-4 border border-gray-200 rounded-lg bg-gray-50'
                >
                  <Gift className='w-5 h-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0' />
                  <div className='flex-1'>
                    <div className='text-sm text-gray-900'>
                      {benefit.description}
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                      {benefit.rewardRate > 0 && (
                        <span className='text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full'>
                          {benefit.rewardRate}% {benefit.rewardType}
                        </span>
                      )}
                      {benefit.rewardCap && (
                        <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
                          Up to ₹{benefit.rewardCap.toLocaleString()}
                          {benefit.capPeriod && `/${benefit.capPeriod}`}
                        </span>
                      )}
                      {benefit.value &&
                        benefit.value !== benefit.description && (
                          <span className='text-xs text-primary-600 font-medium'>
                            {benefit.value}
                          </span>
                        )}
                    </div>
                    {benefit.conditions.length > 0 && (
                      <div className='text-xs text-gray-500 mt-1'>
                        {benefit.conditions.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <Gift className='w-12 h-12 mx-auto mb-3 text-gray-300' />
              <p>No benefits available</p>
              <p className='text-sm mt-1'>
                Benefits are automatically loaded from card database
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title='Delete Card'
      >
        <div className='space-y-4'>
          <p className='text-gray-600'>
            Are you sure you want to delete <strong>{card.cardName}</strong>?
            This action cannot be undone.
          </p>
          <div className='flex space-x-3'>
            <Button
              variant='outline'
              onClick={() => setShowDeleteModal(false)}
              className='flex-1'
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className='flex-1 bg-red-600 hover:bg-red-700'
            >
              {deleting ? (
                <div className='flex items-center justify-center gap-2'>
                  <LoadingSpinner size='sm' />
                  <span>Deleting...</span>
                </div>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
