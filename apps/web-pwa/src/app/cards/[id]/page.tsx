'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CardVisual } from '@/components/cards/CardVisual';
import { Modal } from '@/components/ui/Modal';
import { useCardStore } from '@/stores/cardStore';
import { cardSearchService } from '@finmatter/cc-engine';
import { Card } from '@finmatter/types';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Gift,
  TrendingUp,
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

  // Fetch card details
  useEffect(() => {
    if (!cards.length) {
      fetchCards();
    } else {
      const foundCard = cards.find(c => c.id === cardId);
      setCard(foundCard || null);
    }
  }, [cardId, cards, fetchCards]);

  // Get card metadata
  const metadata = card?.cardMetadataId
    ? cardSearchService.getCardById(card.cardMetadataId)
    : null;

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

  const handleAddBenefit = () => {
    router.push(`/cards/${cardId}/benefits/add`);
  };

  const handleEditBenefit = (benefitId: string) => {
    router.push(`/cards/${cardId}/benefits/${benefitId}/edit`);
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

        {/* Reward Structure (from metadata) */}
        {metadata &&
          metadata.rewardRules &&
          metadata.rewardRules.length > 0 && (
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <TrendingUp className='w-5 h-5 mr-2 text-primary-500' />
                Reward Structure
              </h2>
              <div className='space-y-3'>
                {metadata.rewardRules.map((rule, index) => (
                  <div
                    key={index}
                    className='flex items-start space-x-3 p-3 bg-gray-50 rounded-lg'
                  >
                    <div className='flex-shrink-0 w-2 h-2 mt-2 bg-primary-500 rounded-full'></div>
                    <div className='flex-1'>
                      <div className='font-medium text-gray-900 capitalize'>
                        {rule.category}
                      </div>
                      <div className='text-sm text-gray-600 mt-1'>
                        {rule.rewardRate}{' '}
                        {rule.rewardUnit === 'percent'
                          ? '% cashback'
                          : rule.rewardUnit === 'points_per_100'
                            ? 'points per ₹100'
                            : 'miles per ₹100'}
                        {rule.cap && ` (cap: ₹${rule.cap.toLocaleString()})`}
                      </div>
                      {rule.conditions && rule.conditions.length > 0 && (
                        <div className='text-xs text-gray-500 mt-1'>
                          {rule.conditions.join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Key Benefits (from metadata) */}
        {metadata && metadata.benefits && metadata.benefits.length > 0 && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
              <Gift className='w-5 h-5 mr-2 text-primary-500' />
              Key Benefits
            </h2>
            <div className='space-y-2'>
              {metadata.benefits.map((benefit, index) => (
                <div key={index} className='flex items-start space-x-3'>
                  <div className='flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full'></div>
                  <div className='text-sm text-gray-700'>{benefit}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Annual Fee Info (from metadata) */}
        {metadata && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Annual Fee
            </h2>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-600'>Fee Amount</span>
                <span className='font-bold text-gray-900'>
                  {metadata.annualFee === 0
                    ? 'FREE'
                    : `₹${metadata.annualFee.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Custom Benefits */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Custom Benefits
            </h2>
            <Button
              size='sm'
              onClick={handleAddBenefit}
              className='flex items-center space-x-2'
            >
              <Plus className='w-4 h-4' />
              <span>Add Benefit</span>
            </Button>
          </div>

          {card.benefits && card.benefits.length > 0 ? (
            <div className='space-y-3'>
              {card.benefits.map(benefit => (
                <div
                  key={benefit.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors'
                >
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900 capitalize'>
                      {benefit.category}
                    </div>
                    <div className='text-sm text-gray-600 mt-1'>
                      {benefit.description}
                    </div>
                    {benefit.value && (
                      <div className='text-sm text-primary-600 mt-1 font-medium'>
                        {benefit.value}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditBenefit(benefit.id)}
                    className='ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <Edit className='w-4 h-4' />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <Gift className='w-12 h-12 mx-auto mb-3 text-gray-300' />
              <p>No custom benefits added yet</p>
              <p className='text-sm mt-1'>
                Add benefits to track special offers and perks
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
              {deleting ? <LoadingSpinner size='sm' /> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
