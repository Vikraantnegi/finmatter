'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CardVisual } from '@/components/cards/CardVisual';
import { UploadStatementModal } from '@/components/statements/UploadStatementModal';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { Modal } from '@/components/ui/Modal';
import { useCardStore } from '@/stores/cardStore';
import { cardService } from '@/services/cardService';
import { useStatements } from '@/hooks/useStatements';
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
  Upload,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;

  const { cards, isLoading: loading, fetchCards, deleteCard } = useCardStore();
  const [card, setCard] = useState<Card | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [benefits, setBenefits] = useState<CardBenefitResponse[]>([]);
  const [benefitsLoading, setBenefitsLoading] = useState(false);
  const [_cardMetadata, setCardMetadata] =
    useState<CardMetadataResponse | null>(null);

  // Fetch statements for this card
  const { statements, isLoading: statementsLoading } = useStatements({
    cardId,
  });

  // Fallback function for when individual card fetch fails
  const handleCardFetchFallback = useCallback(() => {
    if (!cards.length) {
      fetchCards();
    } else {
      const foundCard = cards.find(c => c.id === cardId);
      setCard(foundCard || null);
    }
  }, [cards, cardId, fetchCards]);

  // Fetch card details
  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        const cardData = await cardService.getCardById(cardId);
        setCard(cardData);
      } catch (error) {
        console.error('Failed to fetch card details:', error);
        // Fallback to fetching all cards if individual fetch fails
        handleCardFetchFallback();
      }
    };

    if (cardId) {
      fetchCardDetails();
    }
  }, [cardId, handleCardFetchFallback]);

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
    <div className='min-h-screen bg-white'>
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

        {/* Statements Section */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>Statements</h2>
            {statements && statements.length > 0 && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className='flex items-center gap-2'
                size='sm'
              >
                <Upload className='w-4 h-4' />
                Upload Statement
              </Button>
            )}
          </div>

          {statementsLoading ? (
            <div className='text-center flex-col items-center justify-center py-8 w-full'>
              <LoadingSpinner size='md' className='mx-auto' />
              <p className='text-gray-500 mt-2'>Loading statements...</p>
            </div>
          ) : statements && statements.length > 0 ? (
            <div className='space-y-3'>
              {statements.map(statement => (
                <div
                  key={statement.id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <Calendar className='w-5 h-5 text-primary-500' />
                    <div>
                      <div className='text-sm font-medium text-gray-900'>
                        {statement.fileName}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Uploaded:{' '}
                        {new Date(statement.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-3'>
                    <div className='text-right'>
                      <div className='text-sm font-medium text-gray-900'>
                        {statement.transactionCount || 0} transactions
                      </div>
                      <div
                        className={`text-xs capitalize ${
                          statement.status === 'success'
                            ? 'text-green-600'
                            : statement.status === 'failed'
                              ? 'text-red-600'
                              : statement.status === 'processing'
                                ? 'text-yellow-600'
                                : 'text-gray-500'
                        }`}
                      >
                        {statement.status}
                      </div>
                    </div>
                    {statement.status === 'success' && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          // Navigate to statement details
                          router.push(`/statements/${statement.id}`);
                        }}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8'>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Upload className='w-6 h-6 text-blue-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Upload Your First Statement
              </h3>
              <p className='text-sm text-gray-600 mb-4'>
                Upload your statement to see credit limit and utilization
              </p>
              <Button
                onClick={() => setShowUploadModal(true)}
                className='flex items-center space-x-2 mx-auto'
              >
                <Upload className='w-4 h-4' />
                <span>Upload Statement</span>
              </Button>
            </div>
          )}
        </div>

        {/* Analytics Section */}
        {statements && statements.length > 0 && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
                <BarChart3 className='w-5 h-5 text-primary-500' />
                Analytics
              </h2>
            </div>
            <AnalyticsDashboard cardId={cardId} />
          </div>
        )}

        {/* Card Stats */}
        {card.hasStatement && (
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
                <div className='text-sm text-gray-600 mb-1'>
                  Available Credit
                </div>
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
          </div>
        )}

        {/* Additional Info */}
        <div className='mt-6 border-t border-gray-200 space-y-3'>
          {card.billingDay && (
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2 text-gray-600'>
                <Calendar className='w-4 h-4' />
                <span className='text-sm'>Billing Day</span>
              </div>
              <span className='font-medium'>{card.billingDay}</span>
            </div>
          )}
          {/* {card.rewardType && (
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2 text-gray-600'>
                <Gift className='w-4 h-4' />
                <span className='text-sm'>Reward Type</span>
              </div>
              <span className='font-medium capitalize'>{card.rewardType}</span>
            </div>
          )} */}
        </div>
        {/* Card Details Information */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Card Details
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Card Type
              </label>
              <p className='text-gray-900 capitalize'>{card.cardType}</p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Network
              </label>
              <p className='text-gray-900 capitalize'>{card.network}</p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Reward Type
              </label>
              <p className='text-gray-900 capitalize'>{card.rewardType}</p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Annual Fee
              </label>
              <p className='text-gray-900'>
                ₹{card.annualFee?.toLocaleString() || '0'}
              </p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Status
              </label>
              <p className='text-gray-900 capitalize'>{card.status}</p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Currency
              </label>
              <p className='text-gray-900 uppercase'>{card.currency}</p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Bank ID
              </label>
              <p className='text-gray-900 uppercase'>{card.bankId}</p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Card Metadata ID
              </label>
              <p className='text-gray-900'>{card.cardMetadataId}</p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Is Custom
              </label>
              <p className='text-gray-900'>{card.isCustom ? 'Yes' : 'No'}</p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Has Statement
              </label>
              <p className='text-gray-900'>
                {card.hasStatement ? 'Yes' : 'No'}
              </p>
            </div>
            {card.billingDay && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-500'>
                  Billing Day
                </label>
                <p className='text-gray-900'>{card.billingDay}</p>
              </div>
            )}
            {card.creditLimit && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-500'>
                  Credit Limit
                </label>
                <p className='text-gray-900'>
                  ₹{card.creditLimit.toLocaleString()}
                </p>
              </div>
            )}
            {card.availableCredit && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-500'>
                  Available Credit
                </label>
                <p className='text-gray-900'>
                  ₹{card.availableCredit.toLocaleString()}
                </p>
              </div>
            )}
            {card.primaryColor && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-500'>
                  Card Colors
                </label>
                <div className='flex items-center space-x-2'>
                  <div
                    className='w-6 h-6 rounded border border-gray-300'
                    style={{ backgroundColor: card.primaryColor }}
                  />
                  {card.secondaryColor && (
                    <div
                      className='w-6 h-6 rounded border border-gray-300'
                      style={{ backgroundColor: card.secondaryColor }}
                    />
                  )}
                </div>
              </div>
            )}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Created At
              </label>
              <p className='text-gray-900 text-sm'>
                {new Date(card.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-500'>
                Updated At
              </label>
              <p className='text-gray-900 text-sm'>
                {new Date(card.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Custom Benefits */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Card Benefits
            </h2>
          </div>

          {benefitsLoading ? (
            <div className='text-center flex-col items-center justify-center py-8 w-full'>
              <LoadingSpinner size='md' className='mx-auto' />
              <p className='text-gray-500 mt-2'>Loading benefits...</p>
            </div>
          ) : benefits && benefits.length > 0 ? (
            <div className='space-y-3'>
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.id || index}
                  className='flex items-start p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'
                >
                  <Gift className='w-5 h-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0' />
                  <div className='flex-1'>
                    <div className='text-sm text-gray-900'>
                      {benefit.description}
                    </div>
                    <div className='flex flex-wrap items-center gap-2 mt-1'>
                      {benefit.rewardRate > 0 &&
                        benefit.rewardType !== 'none' && (
                          <span className='text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full'>
                            {benefit.rewardRate}% {benefit.rewardType}
                          </span>
                        )}
                      {benefit.rewardCap && (
                        <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
                          {benefit.rewardType === 'none' ? (
                            <>
                              Up to {benefit.rewardCap} visits
                              {benefit.capPeriod && `/${benefit.capPeriod}`}
                            </>
                          ) : (
                            <>
                              Up to ₹{benefit.rewardCap.toLocaleString()}
                              {benefit.capPeriod && `/${benefit.capPeriod}`}
                            </>
                          )}
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

        {/* Upload Statement Modal */}
        {showUploadModal && (
          <UploadStatementModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            cardId={card.id}
            cardName={card.cardName}
            bankName={card.bankName}
            onSuccess={() => {
              setShowUploadModal(false);
              toast.success(
                'Statement uploaded! Transactions will appear shortly.',
              );
              // Optionally refresh card data
              fetchCards();
            }}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <Modal
            isOpen={true}
            onClose={() => setShowDeleteModal(false)}
            title='Delete Card'
          >
            <div className='space-y-4'>
              <p className='text-gray-600'>
                Are you sure you want to delete <strong>{card.cardName}</strong>
                ? This action cannot be undone.
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
        )}
      </div>
    </div>
  );
}
