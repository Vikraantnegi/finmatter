'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cardSearchService } from '@finmatter/cc-engine';
import type { CardMetadata, BankMetadata } from '@finmatter/cc-engine';
import { ArrowLeft, Search, CreditCard, Building2 } from 'lucide-react';
import { cardService } from '@/services/cardService';
import toast from 'react-hot-toast';

type SelectionStep = 'bank' | 'card' | 'form';

interface FormData {
  cardHolderName: string;
  lastFourDigits: string;
  expiryDate: string;
  bankName: string;
}

interface FormErrors {
  cardHolderName?: string;
  lastFourDigits?: string;
  expiryDate?: string;
  submit?: string;
}

export default function AddCardPage() {
  const router = useRouter();

  // Step management
  const [step, setStep] = useState<SelectionStep>('bank');
  const [selectedBank, setSelectedBank] = useState<BankMetadata | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardMetadata | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Form data
  const [formData, setFormData] = useState<FormData>({
    cardHolderName: '',
    lastFourDigits: '',
    expiryDate: '',
    bankName: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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
      cardHolderName: '', // Reset to empty for user input
      bankName: selectedBank?.name || '',
    }));
    setStep('form');
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev: FormErrors) => ({
        ...prev,
        [field as keyof FormErrors]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

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
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create card object with proper type mapping
      const newCardData = {
        cardName: formData.cardHolderName, // Map cardHolderName to cardName for API
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
        // These will be fetched from statements, so set default values
        creditLimit: 0,
        availableCredit: 0,
        expiryDate: formData.expiryDate || undefined,
        // Include metadata from selected card
        cardMetadataId: selectedCard?.id,
        bankId: selectedCard?.bankId,
        primaryColor: selectedCard?.primaryColor,
        secondaryColor: selectedCard?.secondaryColor,
        isCustom: !selectedCard, // Custom if no card selected
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
          const fieldErrors: FormErrors = {};
          details.forEach((err: { path?: string[]; message?: string }) => {
            if (err.path && err.path.length > 0) {
              const fieldName = err.path[0] as keyof FormErrors;
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
            Card Holder Name *
          </label>
          <input
            type='text'
            value={formData.cardHolderName}
            onChange={e => handleInputChange('cardHolderName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 ${
              errors.cardHolderName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder='e.g., John Doe'
          />
          {errors.cardHolderName && (
            <p className='text-red-500 text-sm mt-1'>{errors.cardHolderName}</p>
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
            <p className='text-red-500 text-sm mt-1'>{errors.lastFourDigits}</p>
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
