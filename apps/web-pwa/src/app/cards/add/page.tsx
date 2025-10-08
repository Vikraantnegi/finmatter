'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cardSearchService, BankMetadata, CardMetadata } from '@finmatter/cc-engine';
import { cardService } from '@/services/cardService';
import { useCardStore } from '@/stores/cardStore';
import { ArrowLeft, Search } from 'lucide-react';

const cardSchema = z.object({
  name: z.string().min(1, 'Card name is required'),
  bankName: z.string().optional(),
  lastFourDigits: z.string().min(4).max(4).optional(),
  limit: z.number().min(0, 'Limit must be positive'),
  used: z.number().min(0, 'Used amount must be positive'),
  network: z.enum(['visa', 'mastercard', 'rupay', 'amex']).optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(2024).optional(),
});

type CardFormData = z.infer<typeof cardSchema>;

type Step = 'bank' | 'card' | 'form';

export default function AddCardPage() {
  const router = useRouter();
  const { addCard } = useCardStore();
  const [step, setStep] = useState<Step>('bank');
  const [selectedBank, setSelectedBank] = useState<BankMetadata | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      limit: 0,
      used: 0,
    },
  });

  const banks = cardSearchService.getAllBanks();
  const filteredBanks = searchQuery
    ? banks.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : banks;

  const cards = selectedBank
    ? cardSearchService.getCardsByBank(selectedBank.id)
    : [];
  const filteredCards = searchQuery
    ? cards.filter(card =>
        card.cardName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : cards;

  const handleBankSelect = (bank: BankMetadata) => {
    setSelectedBank(bank);
    setSearchQuery('');
    setStep('card');
  };

  const handleCardSelect = (card: CardMetadata) => {
    setSelectedCard(card);
    // Pre-fill form with card metadata
    setValue('name', card.cardName);
    // Get bank name from bank ID
    const bank = cardSearchService.getBankById(card.bankId);
    if (bank) {
      setValue('bankName', bank.name);
    }
    setValue('network', card.network as any);
    setStep('form');
  };

  const handleManualEntry = () => {
    setSelectedCard(null);
    setStep('form');
  };

  const onSubmit = async (data: CardFormData) => {
    try {
      setIsLoading(true);

      const cardData = {
        ...data,
        cardMetadataId: selectedCard?.id,
        bankId: selectedBank?.id,
        primaryColor: selectedCard?.primaryColor,
        secondaryColor: selectedCard?.secondaryColor,
        rewardType: selectedCard?.rewardType,
        isCustom: !selectedCard,
      };

      const newCard = await cardService.createCard(cardData);
      addCard(newCard);
      toast.success('Card added successfully!');
      router.push('/cards');
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to add card');
    } finally {
      setIsLoading(false);
    }
  };

  const renderBankSelection = () => (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          Select Your Bank
        </h2>
        <p className='text-gray-600'>
          Choose your bank to see available credit cards
        </p>
      </div>

      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
        <input
          type='text'
          placeholder='Search banks...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='input pl-10'
        />
      </div>

      {/* Banks Grid */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
        {filteredBanks.map(bank => (
          <button
            key={bank.id}
            onClick={() => handleBankSelect(bank)}
            className='card hover:shadow-md transition-shadow p-4 text-center'
          >
            <div className='text-3xl mb-2'>🏦</div>
            <p className='text-sm font-medium text-gray-900'>{bank.name}</p>
          </button>
        ))}
      </div>

      {/* Manual Entry */}
      <div className='pt-4 border-t border-gray-200'>
        <button
          onClick={handleManualEntry}
          className='text-primary-600 hover:text-primary-700 font-medium'
        >
          Don&apos;t see your bank? Enter manually →
        </button>
      </div>
    </div>
  );

  const renderCardSelection = () => (
    <div className='space-y-6'>
      <div className='flex items-center space-x-4'>
        <button
          onClick={() => {
            setStep('bank');
            setSelectedBank(null);
          }}
          className='text-gray-400 hover:text-gray-600'
        >
          <ArrowLeft className='h-6 w-6' />
        </button>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Select Your Card</h2>
          <p className='text-gray-600'>
            {selectedBank?.name} - Choose your credit card
          </p>
        </div>
      </div>

      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
        <input
          type='text'
          placeholder='Search cards...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='input pl-10'
        />
      </div>

      {/* Cards Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        {filteredCards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardSelect(card)}
            className='card hover:shadow-md transition-shadow p-4 text-left'
            style={{
              background: `linear-gradient(135deg, ${card.primaryColor} 0%, ${card.secondaryColor} 100%)`,
            }}
          >
            <div className='text-white'>
              <p className='text-sm opacity-90 mb-1'>
                {cardSearchService.getBankById(card.bankId)?.name || 'Bank'}
              </p>
              <h3 className='text-lg font-bold mb-2'>{card.cardName}</h3>
              <div className='flex items-center justify-between'>
                <span className='text-xs opacity-80'>
                  {card.network.toUpperCase()}
                </span>
                <span className='text-xs opacity-80'>
                  ₹{card.annualFee === 0 ? 'Free' : card.annualFee}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Manual Entry */}
      <div className='pt-4 border-t border-gray-200'>
        <button
          onClick={handleManualEntry}
          className='text-primary-600 hover:text-primary-700 font-medium'
        >
          Don&apos;t see your card? Enter manually →
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className='space-y-6'>
      <div className='flex items-center space-x-4'>
        {selectedBank && (
          <button
            onClick={() => {
              setStep('card');
              setSelectedCard(null);
            }}
            className='text-gray-400 hover:text-gray-600'
          >
            <ArrowLeft className='h-6 w-6' />
          </button>
        )}
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Card Details</h2>
          <p className='text-gray-600'>
            {selectedCard
              ? `${selectedCard.cardName} - Enter your card details`
              : 'Enter your card details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Card Name */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Card Name *
            </label>
            <input
              {...register('name')}
              className='input'
              placeholder='e.g., HDFC Regalia'
            />
            {errors.name && (
              <p className='text-sm text-error-600 mt-1'>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Bank Name */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Bank Name
            </label>
            <input
              {...register('bankName')}
              className='input'
              placeholder='e.g., HDFC Bank'
            />
          </div>

          {/* Last 4 Digits */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Last 4 Digits
            </label>
            <input
              {...register('lastFourDigits')}
              className='input'
              placeholder='1234'
              maxLength={4}
            />
          </div>

          {/* Network */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Network
            </label>
            <select {...register('network')} className='input'>
              <option value=''>Select network</option>
              <option value='visa'>Visa</option>
              <option value='mastercard'>Mastercard</option>
              <option value='rupay'>RuPay</option>
              <option value='amex'>American Express</option>
            </select>
          </div>

          {/* Credit Limit */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Credit Limit (₹) *
            </label>
            <input
              {...register('limit', { valueAsNumber: true })}
              type='number'
              className='input'
              placeholder='100000'
            />
            {errors.limit && (
              <p className='text-sm text-error-600 mt-1'>
                {errors.limit.message}
              </p>
            )}
          </div>

          {/* Used Amount */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Current Balance (₹) *
            </label>
            <input
              {...register('used', { valueAsNumber: true })}
              type='number'
              className='input'
              placeholder='25000'
            />
            {errors.used && (
              <p className='text-sm text-error-600 mt-1'>
                {errors.used.message}
              </p>
            )}
          </div>

          {/* Expiry Month */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Expiry Month
            </label>
            <input
              {...register('expiryMonth', { valueAsNumber: true })}
              type='number'
              className='input'
              placeholder='12'
              min='1'
              max='12'
            />
          </div>

          {/* Expiry Year */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Expiry Year
            </label>
            <input
              {...register('expiryYear', { valueAsNumber: true })}
              type='number'
              className='input'
              placeholder='2028'
              min='2024'
            />
          </div>
        </div>

        {/* Actions */}
        <div className='flex space-x-4'>
          <Button
            type='button'
            variant='secondary'
            onClick={() => router.push('/cards')}
            className='flex-1'
          >
            Cancel
          </Button>
          <Button type='submit' loading={isLoading} className='flex-1'>
            Add Card
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <DashboardLayout>
      <div className='max-w-4xl mx-auto'>
        {step === 'bank' && renderBankSelection()}
        {step === 'card' && renderCardSelection()}
        {step === 'form' && renderForm()}
      </div>
    </DashboardLayout>
  );
}
