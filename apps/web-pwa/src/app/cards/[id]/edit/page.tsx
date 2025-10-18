'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCardStore } from '@/stores/cardStore';
import { Card } from '@finmatter/types';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditCardPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;

  const { cards, isLoading: loading, fetchCards, updateCard } = useCardStore();
  const [card, setCard] = useState<Card | null>(null);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    cardHolderName: '',
    lastFourDigits: '',
    expiryDate: '',
  });

  const [errors, setErrors] = useState<{
    cardHolderName?: string;
    lastFourDigits?: string;
    expiryDate?: string;
    submit?: string;
  }>({});

  // Fetch card details
  useEffect(() => {
    if (!cards.length) {
      fetchCards();
    } else {
      const foundCard = cards.find(c => c.id === cardId);
      if (foundCard) {
        setCard(foundCard);
        setFormData({
          cardHolderName: foundCard.cardName,
          lastFourDigits: foundCard.lastFourDigits || '',
          expiryDate: foundCard.expiryDate
            ? new Date(foundCard.expiryDate).toLocaleDateString('en-GB', {
                month: '2-digit',
                year: '2-digit',
              })
            : '',
        });
      }
    }
  }, [cardId, cards, fetchCards]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.cardHolderName.trim()) {
      newErrors.cardHolderName = 'Card holder name is required';
    }

    if (!formData.lastFourDigits.trim()) {
      newErrors.lastFourDigits = 'Last 4 digits are required';
    } else if (!/^\d{4}$/.test(formData.lastFourDigits)) {
      newErrors.lastFourDigits = 'Must be exactly 4 digits';
    }

    // Validate expiry date format (MM/YY)
    if (formData.expiryDate && !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Must be in MM/YY format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !card) return;

    setSaving(true);
    try {
      const updatedCard: Partial<Card> = {
        ...card,
        cardName: formData.cardHolderName,
        lastFourDigits: formData.lastFourDigits,
        expiryDate: formData.expiryDate
          ? new Date(
              2000 + parseInt(formData.expiryDate.split('/')[1]),
              parseInt(formData.expiryDate.split('/')[0]) - 1,
            ).toISOString()
          : undefined,
      };

      await updateCard(cardId, updatedCard);
      toast.success('Card updated successfully');
      router.push(`/cards/${cardId}`);
    } catch (error: any) {
      console.error('Failed to update card:', error);

      // Check for specific error codes from API
      const errorData = error.response?.data?.error || error.error;

      if (errorData?.code === 'CARD_ALREADY_EXISTS') {
        // Duplicate card error
        setErrors({
          lastFourDigits: errorData.message,
          submit: errorData.suggestion || 'This card already exists.',
        });
        toast.error(errorData.message);
      } else if (errorData?.code === 'VALIDATION_ERROR') {
        // Validation errors - map to form fields
        const details = errorData.details;
        if (Array.isArray(details)) {
          const fieldErrors: typeof errors = {};
          details.forEach((err: { path?: string[]; message?: string }) => {
            if (err.path && err.path.length > 0) {
              const fieldName = err.path[0] as keyof typeof errors;
              if (fieldName in fieldErrors || fieldName === 'submit') {
                (fieldErrors as any)[fieldName] = err.message;
              }
            }
          });
          setErrors(fieldErrors);
          toast.error('Please check your input and try again.');
        } else {
          setErrors({ submit: errorData.message });
          toast.error(errorData.message);
        }
      } else if (errorData?.code === 'USER_NOT_FOUND') {
        // Session expired
        toast.error(errorData.message);
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      } else {
        // Generic error
        const errorMessage =
          errorData?.message || 'Failed to update card. Please try again.';
        setErrors({ submit: errorMessage });
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
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
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center py-4'>
            <button
              onClick={() => router.back()}
              className='mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5 text-gray-600' />
            </button>
            <h1 className='text-xl font-bold text-gray-900'>Edit Card</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='space-y-6'>
          <div className='text-center'>
            <CreditCard className='w-12 h-12 text-primary-500 mx-auto mb-4' />
            <h2 className='text-xl font-bold text-gray-900 mb-2'>
              Card Details
            </h2>
            <p className='text-gray-600'>Update your card information</p>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Card Holder Name *
              </label>
              <input
                type='text'
                value={formData.cardHolderName}
                onChange={e =>
                  handleInputChange('cardHolderName', e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
                  errors.cardHolderName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='e.g., John Doe'
              />
              {errors.cardHolderName && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.cardHolderName}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Last 4 Digits *
              </label>
              <input
                type='text'
                value={formData.lastFourDigits}
                onChange={e =>
                  handleInputChange(
                    'lastFourDigits',
                    e.target.value.replace(/\D/g, '').slice(0, 4),
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
                  errors.lastFourDigits ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='1234'
              />
              {errors.lastFourDigits && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.lastFourDigits}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Expiry Date
              </label>
              <input
                type='text'
                value={formData.expiryDate}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted =
                    value.length >= 2
                      ? `${value.slice(0, 2)}/${value.slice(2, 4)}`
                      : value;
                  handleInputChange('expiryDate', formatted);
                }}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900'
                placeholder='MM/YY'
                maxLength={5}
              />
              {errors.expiryDate && (
                <p className='text-red-500 text-sm mt-1'>{errors.expiryDate}</p>
              )}
            </div>

            <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-blue-800 text-sm flex items-center gap-2'>
                <span>💡</span>
                <span>
                  Credit limit, available credit, and billing day will be
                  automatically fetched from your statements.
                </span>
              </p>
            </div>

            {errors.submit && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-red-600 text-sm'>{errors.submit}</p>
              </div>
            )}
          </div>

          <div className='flex space-x-3'>
            <Button
              variant='outline'
              onClick={() => router.back()}
              className='flex-1'
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className='flex-1 flex items-center justify-center space-x-2'
            >
              {saving ? (
                <div className='flex items-center justify-center gap-2'>
                  <LoadingSpinner size='sm' />
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Save className='w-4 h-4' />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
