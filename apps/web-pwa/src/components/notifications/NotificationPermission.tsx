'use client';

import { useEffect, useState } from 'react';
import { NotificationService } from '@/services/notificationService';

export function NotificationPermission() {
  const [permission, setPermission] = useState<
    'default' | 'granted' | 'denied'
  >('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);

      // Show prompt after 3 seconds if permission is default
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setPermission(granted ? 'granted' : 'denied');
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || permission !== 'default') {
    return null;
  }

  return (
    <div className='fixed bottom-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4'>
      <div className='flex items-start gap-3'>
        <div className='flex-shrink-0'>
          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 17h5l-5 5v-5zM4.5 19.5L19.5 4.5M15 4.5h5v5'
              />
            </svg>
          </div>
        </div>
        <div className='flex-1 min-w-0'>
          <h3 className='text-sm font-medium text-gray-900'>
            Enable Notifications
          </h3>
          <p className='text-sm text-gray-600 mt-1'>
            Get notified when your statements are processed and ready to view.
          </p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={handleDismiss}
            className='text-sm text-gray-500 hover:text-gray-700'
          >
            Dismiss
          </button>
          <button
            onClick={handleRequestPermission}
            className='text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700'
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}
