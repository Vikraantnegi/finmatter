'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCardStore } from '@/stores/cardStore';
import { Card } from '@finmatter/types';
import { ArrowLeft, Save } from 'lucide-react';
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
    cardName: '',
    lastFourDigits: '',
    creditLimit: '',
    availableCredit: '',
    billingDay: '',
    expiryDate: '',
  });

  const [errors, setErrors] = useState<any>({});

  // Fetch card details
  useEffect(() => {
    if (!cards.length) {
      fetchCards();
    } else {
      const foundCard = cards.find(c => c.id === cardId);
      if (foundCard) {
        setCard(foundCard);
        setFormData({
          cardName: foundCard.cardName,
          lastFourDigits: foundCard.lastFourDigits || '',
          creditLimit: foundCard.creditLimit?.toString() || '',
          availableCredit: foundCard.availableCredit?.toString() || '',
          billingDay: foundCard.billingDay?.toString() || '',
          expiryDate: foundCard.expiryDate
            ? new Date(foundCard.expiryDate).toISOString().split('T')[0]
            : '',
        });
      }
    }
  }, [cardId, cards, fetchCards]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.cardName.trim()) {
      newErrors.cardName = 'Card name is required';
    }

    if (!formData.lastFourDigits.trim()) {
      newErrors.lastFourDigits = 'Last 4 digits are required';
    } else if (!/^\d{4}$/.test(formData.lastFourDigits)) {
      newErrors.lastFourDigits = 'Must be exactly 4 digits';
    }

    if (!formData.creditLimit.trim()) {
      newErrors.creditLimit = 'Credit limit is required';
    } else if (
      isNaN(Number(formData.creditLimit)) ||
      Number(formData.creditLimit) <= 0
    ) {
      newErrors.creditLimit = 'Must be a valid positive number';
    }

    if (!formData.availableCredit.trim()) {
      newErrors.availableCredit = 'Available credit is required';
    } else if (
      isNaN(Number(formData.availableCredit)) ||
      Number(formData.availableCredit) < 0
    ) {
      newErrors.availableCredit = 'Must be a valid non-negative number';
    }

    if (
      formData.billingDay &&
      (isNaN(Number(formData.billingDay)) ||
        Number(formData.billingDay) < 1 ||
        Number(formData.billingDay) > 31)
    ) {
      newErrors.billingDay = 'Must be a valid day (1-31)';
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
        cardName: formData.cardName,
        lastFourDigits: formData.lastFourDigits,
        creditLimit: Number(formData.creditLimit),
        availableCredit: Number(formData.availableCredit),
        billingDay: formData.billingDay
          ? Number(formData.billingDay)
          : undefined,
        expiryDate: formData.expiryDate || undefined,
      };

      await updateCard(cardId, updatedCard);
      toast.success('Card updated successfully');
      router.push(`/cards/${cardId}`);
    } catch (error) {
      console.error('Error updating card:', error);
      toast.error('Failed to update card');
      setErrors({ submit: 'Failed to update card. Please try again.' });
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
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
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
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Card Name *
            </label>
            <input
              type='text'
              value={formData.cardName}
              onChange={e => handleInputChange('cardName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.cardName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder='e.g., HDFC Millennia Credit Card'
            />
            {errors.cardName && (
              <p className='text-red-500 text-sm mt-1'>{errors.cardName}</p>
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
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

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Credit Limit *
              </label>
              <input
                type='text'
                value={formData.creditLimit}
                onChange={e =>
                  handleInputChange(
                    'creditLimit',
                    e.target.value.replace(/\D/g, ''),
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.creditLimit ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='100000'
              />
              {errors.creditLimit && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.creditLimit}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Available Credit *
              </label>
              <input
                type='text'
                value={formData.availableCredit}
                onChange={e =>
                  handleInputChange(
                    'availableCredit',
                    e.target.value.replace(/\D/g, ''),
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.availableCredit ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='75000'
              />
              {errors.availableCredit && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.availableCredit}
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Billing Day
              </label>
              <input
                type='text'
                value={formData.billingDay}
                onChange={e =>
                  handleInputChange(
                    'billingDay',
                    e.target.value.replace(/\D/g, '').slice(0, 2),
                  )
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.billingDay ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='15'
              />
              {errors.billingDay && (
                <p className='text-red-500 text-sm mt-1'>{errors.billingDay}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Expiry Date
              </label>
              <input
                type='date'
                value={formData.expiryDate}
                onChange={e => handleInputChange('expiryDate', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              />
            </div>
          </div>

          {errors.submit && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-600 text-sm'>{errors.submit}</p>
            </div>
          )}

          <div className='flex space-x-3 pt-4'>
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
                <LoadingSpinner size='sm' />
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
