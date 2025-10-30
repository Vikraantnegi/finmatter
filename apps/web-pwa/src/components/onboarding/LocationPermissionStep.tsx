'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MapPin, TrendingUp, Tag, Shield } from 'lucide-react';

interface LocationPermissionStepProps {
  onNext: (granted: boolean) => void;
  onUpdateFormData: (updates: { locationEnabled: boolean }) => void;
}

export default function LocationPermissionStep({
  onNext,
  onUpdateFormData,
}: LocationPermissionStepProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      let granted = false;
      if (navigator.geolocation) {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              granted = true;
              resolve();
            },
            () => {
              reject();
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 },
          );
        });
      }

      onUpdateFormData({ locationEnabled: granted });
      onNext(granted);
    } catch (error) {
      // User denied or error occurred
      onUpdateFormData({ locationEnabled: false });
      onNext(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onUpdateFormData({ locationEnabled: false });
    onNext(false);
  };

  return (
    <div className='min-h-screen bg-background-dark flex items-center justify-center px-6'>
      <div className='max-w-md w-full space-y-8 py-8'>
        {/* Progress Dots */}
        <div className='flex justify-center gap-2 mb-4'>
          <div className='w-2 h-2 rounded-full bg-green-500' />
          <div className='w-2 h-2 rounded-full bg-gray-700' />
          <div className='w-2 h-2 rounded-full bg-gray-700' />
        </div>

        {/* Icon/Visual */}
        <div className='flex justify-center'>
          <div className='w-32 h-32 rounded-3xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center border border-green-500/20'>
            <MapPin className='w-16 h-16 text-green-500' />
          </div>
        </div>

        {/* Header */}
        <div className='text-center space-y-3'>
          <h1 className='text-3xl font-bold text-white'>Location Access</h1>
          <p className='text-base text-gray-400'>
            Unlock smarter rewards with your location
          </p>
        </div>

        {/* Benefits */}
        <div className='space-y-4 bg-gray-900/50 rounded-2xl p-6 border border-gray-800'>
          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0'>
              <TrendingUp className='w-5 h-5 text-green-500' />
            </div>
            <div>
              <h3 className='text-white font-semibold mb-1'>
                Maximized Rewards
              </h3>
              <p className='text-sm text-gray-400'>
                Get real-time suggestions for the best card to use at your
                current location
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0'>
              <Tag className='w-5 h-5 text-green-500' />
            </div>
            <div>
              <h3 className='text-white font-semibold mb-1'>
                Automated Tracking
              </h3>
              <p className='text-sm text-gray-400'>
                Effortlessly categorize your spending based on where you shop
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0'>
              <Shield className='w-5 h-5 text-green-500' />
            </div>
            <div>
              <h3 className='text-white font-semibold mb-1'>
                Enhanced Security
              </h3>
              <p className='text-sm text-gray-400'>
                Help us verify transaction locations to protect your account
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Inline */}
        <div className='flex gap-3 pt-4'>
          <Button
            variant='outline'
            onClick={handleSkip}
            disabled={isRequesting}
            className='flex-1 h-14 border-2 border-gray-700 hover:border-gray-600 bg-transparent text-gray-300 font-semibold rounded-xl disabled:opacity-40 transition-all'
          >
            Skip
          </Button>

          <Button
            onClick={handleEnable}
            disabled={isRequesting}
            className='flex-1 h-14 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl disabled:opacity-40 transition-all'
          >
            {isRequesting ? 'Requesting...' : 'Enable'}
          </Button>
        </div>

        {/* Privacy Note */}
        <p className='text-xs text-gray-500 text-center leading-relaxed'>
          Your privacy is important. You can manage your preferences in Settings
          at any time.
        </p>
      </div>
    </div>
  );
}
