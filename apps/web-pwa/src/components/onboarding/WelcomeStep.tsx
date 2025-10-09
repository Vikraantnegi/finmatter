'use client';

import { Button } from '@/components/ui/Button';

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='max-w-md w-full text-center space-y-8'>
        {/* Logo/Icon */}
        <div className='flex justify-center'>
          <div className='w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center'>
            <span className='text-white text-2xl font-bold'>FM</span>
          </div>
        </div>

        {/* Welcome Content */}
        <div className='space-y-4'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Welcome to FinMatter! 👋
          </h1>
          <p className='text-lg text-gray-600 leading-relaxed'>
            Your smart credit card companion that helps you maximize rewards and
            manage your finances effortlessly.
          </p>
        </div>

        {/* Features Preview */}
        <div className='space-y-3'>
          <div className='flex items-center space-x-3 text-left'>
            <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <span className='text-green-600 text-sm'>💳</span>
            </div>
            <span className='text-gray-700'>
              Track all your credit cards in one place
            </span>
          </div>

          <div className='flex items-center space-x-3 text-left'>
            <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <span className='text-blue-600 text-sm'>🎯</span>
            </div>
            <span className='text-gray-700'>
              Get smart recommendations for every purchase
            </span>
          </div>

          <div className='flex items-center space-x-3 text-left'>
            <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <span className='text-purple-600 text-sm'>📊</span>
            </div>
            <span className='text-gray-700'>
              Analyze spending patterns and optimize rewards
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className='pt-4'>
          <Button onClick={onNext} size='lg' className='w-full'>
            Let&apos;s Get Started!
          </Button>
        </div>
      </div>
    </div>
  );
}
