'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface AddFirstCardStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function AddFirstCardStep({ onSkip }: AddFirstCardStepProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCard = async () => {
    try {
      setIsLoading(true);
      // Navigate to add card page
      router.push('/cards/add');
    } catch (error) {
      // Error handled by component
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center'>
              <span className='text-white text-xl font-bold'>💳</span>
            </div>
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Add Your First Card
          </h1>
          <p className='text-gray-600'>
            Let&apos;s start by adding your first credit card to begin tracking
            rewards and optimizing your spending.
          </p>
        </div>

        {/* Benefits Card */}
        <div className='bg-white rounded-xl border border-gray-200 p-6 space-y-4'>
          <h3 className='font-medium text-gray-900'>What you&apos;ll get:</h3>
          <div className='space-y-3'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-green-600 text-sm'>✓</span>
              </div>
              <span className='text-sm text-gray-700'>
                Smart spending recommendations
              </span>
            </div>

            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-blue-600 text-sm'>✓</span>
              </div>
              <span className='text-sm text-gray-700'>
                Reward tracking and optimization
              </span>
            </div>

            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-purple-600 text-sm'>✓</span>
              </div>
              <span className='text-sm text-gray-700'>
                Spending insights and analytics
              </span>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
          <div className='flex items-start space-x-3'>
            <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <span className='text-blue-600 text-xs'>🔒</span>
            </div>
            <div>
              <h4 className='text-sm font-medium text-blue-900'>
                Your data is secure
              </h4>
              <p className='text-xs text-blue-700 mt-1'>
                We use bank-level encryption and never store your full card
                numbers. Only you can access your data.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='space-y-3'>
          <Button
            onClick={handleAddCard}
            disabled={isLoading}
            size='lg'
            className='w-full'
          >
            {isLoading ? 'Opening...' : 'Add My First Card'}
          </Button>

          <Button
            variant='outline'
            onClick={handleSkip}
            size='lg'
            className='w-full'
          >
            Skip for now
          </Button>
        </div>

        {/* Help Text */}
        <div className='text-center'>
          <p className='text-xs text-gray-500'>
            You can always add cards later from the main dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
