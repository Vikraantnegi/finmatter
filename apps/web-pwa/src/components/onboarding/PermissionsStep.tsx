'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

interface PermissionsStepProps {
  onNext: () => void;
  onSkip: () => void;
  onUpdateFormData: (updates: { notificationsEnabled: boolean }) => void;
}

export default function PermissionsStep({
  onNext,
  onSkip,
  onUpdateFormData,
}: PermissionsStepProps) {
  const { setNotificationPermission } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<
    'unknown' | 'granted' | 'denied' | 'unavailable' | 'default'
  >('unknown');

  const requestNotificationPermission = async () => {
    try {
      setIsLoading(true);

      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission === 'default' ? 'denied' : permission);
        const isGranted = permission === 'granted';
        setNotificationPermission(isGranted);
        onUpdateFormData({ notificationsEnabled: isGranted });

        if (permission === 'granted') {
          // Show a test notification
          new Notification('FinMatter', {
            body: "Welcome to FinMatter! We'll keep you updated on your credit card rewards.",
            icon: '/icons/icon-192x192.png',
          });
        }
      } else {
        setNotificationStatus('unavailable');
        setNotificationPermission(false);
        onUpdateFormData({ notificationsEnabled: false });
      }
    } catch (error) {
      // Error handled silently
      setNotificationStatus('denied');
      setNotificationPermission(false);
      onUpdateFormData({ notificationsEnabled: false });
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationStatusMessage = () => {
    switch (notificationStatus) {
      case 'granted':
        return "Great! You'll receive important updates about your credit cards.";
      case 'denied':
        return 'No worries! You can always enable notifications later in settings.';
      case 'unavailable':
        return 'Notifications are not supported in this browser.';
      default:
        return 'Get notified about important updates and rewards opportunities.';
    }
  };

  const getNotificationStatusColor = () => {
    switch (notificationStatus) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-yellow-600';
      case 'unavailable':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center'>
              <span className='text-white text-xl font-bold'>🔔</span>
            </div>
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>Stay in the Loop</h1>
          <p className='text-gray-600'>
            Enable notifications to never miss important updates about your
            credit cards.
          </p>
        </div>

        {/* Permission Card */}
        <div className='bg-white rounded-xl border border-gray-200 p-6 space-y-4'>
          <div className='flex items-start space-x-3'>
            <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'>
              <span className='text-blue-600'>🔔</span>
            </div>
            <div className='flex-1'>
              <h3 className='font-medium text-gray-900'>Push Notifications</h3>
              <p className='text-sm text-gray-600 mt-1'>
                {getNotificationStatusMessage()}
              </p>
              <p className={`text-sm mt-2 ${getNotificationStatusColor()}`}>
                Status:{' '}
                {notificationStatus === 'unknown'
                  ? 'Not requested'
                  : notificationStatus}
              </p>
            </div>
          </div>

          {notificationStatus === 'unknown' && (
            <Button
              onClick={requestNotificationPermission}
              disabled={isLoading}
              size='sm'
              className='w-full'
            >
              {isLoading ? 'Requesting...' : 'Enable Notifications'}
            </Button>
          )}
        </div>

        {/* Benefits */}
        <div className='space-y-3'>
          <h3 className='font-medium text-gray-900'>
            You&apos;ll get notified about:
          </h3>
          <div className='space-y-2'>
            <div className='flex items-center space-x-3'>
              <div className='w-2 h-2 bg-primary-500 rounded-full'></div>
              <span className='text-sm text-gray-600'>
                High reward opportunities
              </span>
            </div>
            <div className='flex items-center space-x-3'>
              <div className='w-2 h-2 bg-primary-500 rounded-full'></div>
              <span className='text-sm text-gray-600'>Payment due dates</span>
            </div>
            <div className='flex items-center space-x-3'>
              <div className='w-2 h-2 bg-primary-500 rounded-full'></div>
              <span className='text-sm text-gray-600'>
                New card recommendations
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='space-y-3'>
          <Button onClick={onNext} size='lg' className='w-full'>
            Continue
          </Button>

          <Button
            variant='outline'
            onClick={onSkip}
            size='lg'
            className='w-full'
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
