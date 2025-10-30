'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Bell, Calendar, AlertCircle, Sparkles } from 'lucide-react';

interface NotificationPermissionStepProps {
  onNext: (granted: boolean) => void;
  onUpdateFormData: (updates: { notificationsEnabled: boolean }) => void;
}

export default function NotificationPermissionStep({
  onNext,
  onUpdateFormData,
}: NotificationPermissionStepProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      let granted = false;
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        granted = permission === 'granted';

        if (granted) {
          // Show a welcome notification
          new Notification('FinMatter', {
            body: "You're all set! We'll keep you updated on your credit card rewards.",
            icon: '/icons/icon-192x192.png',
          });
        }
      }

      onUpdateFormData({ notificationsEnabled: granted });
      onNext(granted);
    } catch (error) {
      onUpdateFormData({ notificationsEnabled: false });
      onNext(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onUpdateFormData({ notificationsEnabled: false });
    onNext(false);
  };

  return (
    <div className='min-h-screen bg-background-dark flex items-center justify-center px-6'>
      <div className='max-w-md w-full space-y-8 py-8'>
        {/* Progress Dots */}
        <div className='flex justify-center gap-2 mb-4'>
          <div className='w-2 h-2 rounded-full bg-gray-700' />
          <div className='w-2 h-2 rounded-full bg-primary' />
          <div className='w-2 h-2 rounded-full bg-gray-700' />
        </div>

        {/* Icon/Visual */}
        <div className='flex justify-center'>
          <div className='w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-blue-600/10 flex items-center justify-center border border-primary/20'>
            <Bell className='w-16 h-16 text-primary' />
          </div>
        </div>

        {/* Header */}
        <div className='text-center space-y-3'>
          <h1 className='text-3xl font-bold text-white'>
            Stay on Top of Your Finances
          </h1>
          <p className='text-base text-gray-400'>
            Enable notifications to receive alerts that help you manage your
            money smarter
          </p>
        </div>

        {/* Benefits */}
        <div className='space-y-4 bg-gray-900/50 rounded-2xl p-6 border border-gray-800'>
          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0'>
              <Calendar className='w-5 h-5 text-primary' />
            </div>
            <div>
              <h3 className='text-white font-semibold mb-1'>Smart Reminders</h3>
              <p className='text-sm text-gray-400'>
                Never miss a payment with smart reminders
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0'>
              <AlertCircle className='w-5 h-5 text-primary' />
            </div>
            <div>
              <h3 className='text-white font-semibold mb-1'>Spending Alerts</h3>
              <p className='text-sm text-gray-400'>
                Receive alerts for unusual spending activity
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0'>
              <Sparkles className='w-5 h-5 text-primary' />
            </div>
            <div>
              <h3 className='text-white font-semibold mb-1'>AI Insights</h3>
              <p className='text-sm text-gray-400'>
                Get personalized AI insights to help you save
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
            Not Now
          </Button>

          <Button
            onClick={handleEnable}
            disabled={isRequesting}
            className='flex-1 h-14 bg-primary hover:opacity-90 text-white font-semibold rounded-xl disabled:opacity-40 transition-all'
          >
            {isRequesting ? 'Requesting...' : 'Allow Notifications'}
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
