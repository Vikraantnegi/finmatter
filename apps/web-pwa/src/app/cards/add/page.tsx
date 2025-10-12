'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cardSearchService } from '@finmatter/cc-engine';
import type { CardMetadata, BankMetadata } from '@finmatter/cc-engine';
import { ArrowLeft, Search, CreditCard, Building2, Plus } from 'lucide-react';
import { cardService } from '@/services/cardService';
import toast from 'react-hot-toast';

type SelectionStep = 'bank' | 'card' | 'form';

export default function AddCardPage() {
  const router = useRouter();

  // Step management
  const [step, setStep] = useState<SelectionStep>('bank');
  const [selectedBank, setSelectedBank] = useState<BankMetadata | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardMetadata | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    cardName: '',
    lastFourDigits: '',
    creditLimit: '',
    availableCredit: '',
    billingDay: '',
    expiryDate: '',
    bankName: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Get banks
  const banks = cardSearchService.getAllBanks();

  // Filter banks by search
  const filteredBanks = searchQuery
    ? banks.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : banks;

  // Get cards for selected bank
  const availableCards = selectedBank
    ? cardSearchService.getCardsByBank(selectedBank.id)
    : [];

  // Filter cards by search
  const filteredCards = searchQuery
    ? availableCards.filter(card =>
        card.cardName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : availableCards;

  const handleBankSelect = (bank: BankMetadata) => {
    setSelectedBank(bank);
    setSearchQuery('');
    setStep('card');
  };

  const handleCardSelect = (card: CardMetadata) => {
    setSelectedCard(card);
    setFormData(prev => ({
      ...prev,
      cardName: card.cardName,
      bankName: selectedBank?.name || '',
    }));
    setStep('form');
  };

  const handleManualEntry = () => {
    setSelectedCard(null);
    setFormData(prev => ({
      ...prev,
      bankName: selectedBank?.name || '',
    }));
    setStep('form');
  };

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
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create card object with proper type mapping
      const newCardData = {
        cardName: formData.cardName,
        lastFourDigits: formData.lastFourDigits,
        cardType: 'credit' as const,
        network: (selectedCard?.network || 'visa') as
          | 'visa'
          | 'mastercard'
          | 'rupay'
          | 'amex'
          | 'discover',
        rewardType: (selectedCard?.rewardType || 'cashback') as
          | 'cashback'
          | 'points'
          | 'miles'
          | 'none',
        bankName: formData.bankName,
        annualFee: selectedCard?.annualFee || 0,
        currency: 'INR',
        creditLimit: Number(formData.creditLimit),
        availableCredit: Number(formData.availableCredit),
        expiryDate: formData.expiryDate || undefined,
      };

      // Call API to create card
      const response = await cardService.createCard(newCardData);

      toast.success('Card added successfully!');

      // Redirect to card details or cards list
      router.push(`/cards/${response.id}`);
    } catch (error: any) {
      console.error('Failed to create card:', error);

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
          const fieldErrors: any = {};
          details.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              const fieldName = err.path[0];
              fieldErrors[fieldName] = err.message;
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
          errorData?.message || 'Failed to create card. Please try again.';
        setErrors({ submit: errorMessage });
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'card') {
      setStep('bank');
      setSelectedBank(null);
      setSelectedCard(null);
    } else if (step === 'form') {
      setStep('card');
      setSelectedCard(null);
    } else {
      router.back();
    }
  };

  const renderBankSelection = () => (
    <div className='space-y-6'>
      <div className='text-center'>
        <Building2 className='w-12 h-12 text-primary-500 mx-auto mb-4' />
        <h2 className='text-xl font-bold text-gray-900 mb-2'>
          Select Your Bank
        </h2>
        <p className='text-gray-600'>
          Choose the bank that issued your credit card
        </p>
      </div>

      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
        <input
          type='text'
          placeholder='Search banks...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
        />
      </div>

      <div className='grid gap-3'>
        {filteredBanks.map(bank => (
          <button
            key={bank.id}
            onClick={() => handleBankSelect(bank)}
            className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left'
          >
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center'>
                <Building2 className='w-5 h-5 text-primary-600' />
              </div>
              <div>
                <div className='font-medium text-gray-900'>{bank.name}</div>
                <div className='text-sm text-gray-500'>
                  {cardSearchService.getCardsByBank(bank.id).length} cards
                  available
                </div>
              </div>
            </div>
            <div className='text-gray-400'>
              <ArrowLeft className='w-4 h-4 rotate-180' />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCardSelection = () => (
    <div className='space-y-6'>
      <div className='text-center'>
        <CreditCard className='w-12 h-12 text-primary-500 mx-auto mb-4' />
        <h2 className='text-xl font-bold text-gray-900 mb-2'>
          Select Your Card
        </h2>
        <p className='text-gray-600'>
          Choose from {selectedBank?.name}&apos;s available cards
        </p>
      </div>

      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
        <input
          type='text'
          placeholder='Search cards...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
        />
      </div>

      <div className='grid gap-3'>
        {filteredCards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardSelect(card)}
            className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left'
          >
            <div className='flex items-center space-x-3'>
              <div
                className='w-10 h-10 rounded-lg flex items-center justify-center text-white'
                style={{
                  background: `linear-gradient(135deg, ${card.primaryColor || '#3b82f6'}, ${card.secondaryColor || '#1d4ed8'})`,
                }}
              >
                <CreditCard className='w-5 h-5' />
              </div>
              <div>
                <div className='font-medium text-gray-900'>{card.cardName}</div>
                <div className='text-sm text-gray-500 capitalize'>
                  {card.rewardType} • {card.network}
                </div>
              </div>
            </div>
            <div className='text-gray-400'>
              <ArrowLeft className='w-4 h-4 rotate-180' />
            </div>
          </button>
        ))}

        <button
          onClick={handleManualEntry}
          className='flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-gray-600'
        >
          <div className='flex items-center space-x-2'>
            <Plus className='w-5 h-5' />
            <span className='font-medium'>Add Card Manually</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className='space-y-6'>
      <div className='text-center'>
        <CreditCard className='w-12 h-12 text-primary-500 mx-auto mb-4' />
        <h2 className='text-xl font-bold text-gray-900 mb-2'>Card Details</h2>
        <p className='text-gray-600'>
          {selectedCard
            ? `Fill in details for ${selectedCard.cardName}`
            : 'Enter your card information'}
        </p>
      </div>

      <div className='space-y-4'>
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
            <p className='text-red-500 text-sm mt-1'>{errors.lastFourDigits}</p>
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
              <p className='text-red-500 text-sm mt-1'>{errors.creditLimit}</p>
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
              <span className='ml-1 text-xs font-normal text-gray-500'>
                (Optional)
              </span>
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
              placeholder='15 (optional)'
            />
            <p className='text-xs text-gray-500 mt-1 flex items-center gap-1'>
              <span>💡</span>
              <span>We'll fetch this from your statement</span>
            </p>
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
      </div>

      <div className='flex space-x-3'>
        <Button variant='outline' onClick={handleBack} className='flex-1'>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className='flex-1'>
          {loading ? (
            <div className='flex items-center justify-center gap-2'>
              <LoadingSpinner size='sm' />
              <span>Adding Card...</span>
            </div>
          ) : (
            'Add Card'
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 sticky top-0 z-30'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center py-4'>
            <button
              onClick={handleBack}
              className='mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5 text-gray-600' />
            </button>
            <h1 className='text-xl font-bold text-gray-900'>
              {step === 'bank' && 'Select Bank'}
              {step === 'card' && 'Select Card'}
              {step === 'form' && 'Add Card'}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {step === 'bank' && renderBankSelection()}
        {step === 'card' && renderCardSelection()}
        {step === 'form' && renderForm()}
      </div>
    </div>
  );
}
