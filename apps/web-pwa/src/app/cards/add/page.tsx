'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  Calendar,
  Lock,
  User,
  Check,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card3DPreview } from '@/components/cards/Card3DPreview';
import { Button } from '@/components/ui/Button';
import {
  detectCard,
  formatCardNumber,
  CardDetectionResult,
} from '@/services/cardDetectionService';
import { cardService } from '@/services/cardService';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function AddCardPage() {
  const router = useRouter();

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detection state
  const [detection, setDetection] = useState<CardDetectionResult>({
    network: 'Unknown',
    isValid: false,
    formatted: '',
  });

  // Auto-detect card as user types
  useEffect(() => {
    if (cardNumber.length >= 6) {
      const result = detectCard(cardNumber);
      setDetection(result);
    } else {
      setDetection({
        network: 'Unknown',
        isValid: false,
        formatted: '',
      });
    }
  }, [cardNumber]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(value) && value.length <= 16) {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'month' | 'year',
  ) => {
    const value = e.target.value.replace(/\D/g, '');
    if (type === 'month') {
      if (value.length <= 2 && (value === '' || parseInt(value) <= 12)) {
        setExpiryMonth(value);
      }
    } else {
      if (value.length <= 2) {
        setExpiryYear(value);
      }
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= (detection.network === 'Amex' ? 4 : 3)) {
      setCvv(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!detection.isValid) {
      toast.error('Please enter a valid card number');
      return;
    }

    if (!cardholderName.trim()) {
      toast.error('Please enter cardholder name');
      return;
    }

    if (!expiryMonth || !expiryYear) {
      toast.error('Please enter expiry date');
      return;
    }

    if (!cvv) {
      toast.error('Please enter CVV');
      return;
    }

    try {
      setIsSubmitting(true);

      // Fetch metadata from BIN lookup
      const bin = cardNumber.replace(/\s/g, '').slice(0, 8);
      let cardMetadata: any = null;

      try {
        const binResponse: any = await apiClient.get(
          `/api/cards/bin-lookup?bin=${bin}`,
        );
        if (binResponse.success && binResponse.data?.found) {
          cardMetadata = binResponse.data;
        }
      } catch (error) {
        console.warn('BIN lookup failed, continuing with defaults:', error);
      }

      // Prepare card data with metadata if available
      const cardData = {
        bankName:
          cardMetadata?.bankName || detection.bankName || 'Unknown Bank',
        cardName:
          cardMetadata?.cardBrand || detection.cardBrand || 'Credit Card',
        lastFourDigits: cardNumber.slice(-4),
        cardType: cardMetadata?.cardType || 'credit',
        network: detection.network.toLowerCase(),
        rewardType: cardMetadata?.cardMetadata?.reward_type || 'none',
        annualFee: cardMetadata?.cardMetadata?.annual_fee || 0,
        cardMetadataId:
          cardMetadata?.cardMetadataId || cardMetadata?.cardMetadata?.id,
        primaryColor: cardMetadata?.cardMetadata?.primary_color,
        secondaryColor: cardMetadata?.cardMetadata?.secondary_color,
        expiryDate: `${expiryMonth.padStart(2, '0')}/${expiryYear}`,
        isCustom: !cardMetadata?.cardMetadataId,
        currency: 'INR',
      };

      // Call real API to create card
      const card = await cardService.createCard(cardData);

      toast.success('Card added successfully!');
      router.push(`/cards/${card.id}`);
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to add card',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const expiryDisplay =
    expiryMonth && expiryYear
      ? `${expiryMonth.padStart(2, '0')}/${expiryYear}`
      : '';

  return (
    <div className='min-h-screen bg-background-dark pb-20'>
      <PageHeader
        title='Add Card'
        action={
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className='w-10 h-10 flex items-center justify-center rounded-full bg-gray-800/50 hover:bg-gray-800 transition-colors'
          >
            <X className='w-5 h-5 text-white' />
          </motion.button>
        }
      />

      <div className='px-6 py-6 space-y-6'>
        {/* 3D Card Preview */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card3DPreview
            cardNumber={formatCardNumber(cardNumber)}
            cardholderName={cardholderName}
            expiryDate={expiryDisplay}
            network={detection.network}
            bankName={detection.bankName}
            isFlipped={isFlipped}
          />
        </motion.div>

        {/* Detection Info */}
        <AnimatePresence>
          {detection.bankName && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='flex items-center justify-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-xl'
            >
              <Check className='w-5 h-5 text-primary' />
              <span className='text-sm text-primary font-medium'>
                {detection.bankName} {detection.network} detected
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className='space-y-4'
        >
          {/* Card Number */}
          <div>
            <label className='block text-sm font-medium text-gray-400 mb-2'>
              Card Number
            </label>
            <div className='relative'>
              <CreditCard className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500' />
              <input
                type='text'
                value={formatCardNumber(cardNumber)}
                onChange={handleCardNumberChange}
                placeholder='1234 5678 9012 3456'
                className='w-full pl-12 pr-12 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                maxLength={19}
                autoComplete='cc-number'
              />
              {cardNumber.length >= 13 && (
                <div className='absolute right-4 top-1/2 -translate-y-1/2'>
                  {detection.isValid ? (
                    <Check className='w-5 h-5 text-green-500' />
                  ) : (
                    <AlertCircle className='w-5 h-5 text-red-500' />
                  )}
                </div>
              )}
            </div>
            {cardNumber.length >= 13 && !detection.isValid && (
              <p className='mt-1 text-xs text-red-500'>Invalid card number</p>
            )}
          </div>

          {/* Cardholder Name */}
          <div>
            <label className='block text-sm font-medium text-gray-400 mb-2'>
              Cardholder Name
            </label>
            <div className='relative'>
              <User className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500' />
              <input
                type='text'
                value={cardholderName}
                onChange={e => setCardholderName(e.target.value)}
                placeholder='JOHN DOE'
                className='w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 uppercase focus:outline-none focus:border-primary transition-colors'
                autoComplete='cc-name'
              />
            </div>
          </div>

          {/* Expiry & CVV */}
          <div className='grid grid-cols-2 gap-4'>
            {/* Expiry Date */}
            <div>
              <label className='block text-sm font-medium text-gray-400 mb-2'>
                Expiry Date
              </label>
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
                  <input
                    type='text'
                    value={expiryMonth}
                    onChange={e => handleExpiryChange(e, 'month')}
                    placeholder='MM'
                    className='w-full pl-10 pr-2 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-center focus:outline-none focus:border-primary transition-colors'
                    maxLength={2}
                    autoComplete='cc-exp-month'
                  />
                </div>
                <span className='text-gray-500 text-2xl'>/</span>
                <input
                  type='text'
                  value={expiryYear}
                  onChange={e => handleExpiryChange(e, 'year')}
                  placeholder='YY'
                  className='flex-1 px-2 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-center focus:outline-none focus:border-primary transition-colors'
                  maxLength={2}
                  autoComplete='cc-exp-year'
                />
              </div>
            </div>

            {/* CVV */}
            <div>
              <label className='block text-sm font-medium text-gray-400 mb-2'>
                CVV
              </label>
              <div className='relative'>
                <Lock className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500' />
                <input
                  type='text'
                  value={cvv}
                  onChange={handleCvvChange}
                  onFocus={() => setIsFlipped(true)}
                  onBlur={() => setIsFlipped(false)}
                  placeholder='123'
                  className='w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-center focus:outline-none focus:border-primary transition-colors'
                  maxLength={detection.network === 'Amex' ? 4 : 3}
                  autoComplete='cc-csc'
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type='submit'
            disabled={!detection.isValid || isSubmitting}
            className='w-full mt-6 bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors'
          >
            {isSubmitting ? 'Adding Card...' : 'Add Card'}
          </Button>
        </motion.form>

        {/* Security Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className='text-xs text-gray-500 text-center'
        >
          🔒 Your card information is encrypted and secure
        </motion.p>
      </div>
    </div>
  );
}
