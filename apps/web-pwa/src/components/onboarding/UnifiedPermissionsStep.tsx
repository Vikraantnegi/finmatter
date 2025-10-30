'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  MapPin,
  Bell,
  MessageSquare,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface UnifiedPermissionsStepProps {
  onNext: () => void;
  onSkip: () => void;
  onUpdateFormData: (updates: {
    notificationsEnabled: boolean;
    locationEnabled: boolean;
    smsEnabled: boolean;
  }) => void;
}

type PermissionStatus = 'pending' | 'granted' | 'denied';

interface Permission {
  id: 'location' | 'notification' | 'sms';
  icon: any;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  iconBg: string;
}

const PERMISSIONS: Permission[] = [
  {
    id: 'location',
    icon: MapPin,
    title: 'Location Access',
    description: 'Unlock smarter rewards with your location',
    benefits: [
      'Maximized Rewards: Get real-time suggestions for the best card to use at your current location',
      'Automated Tracking: Effortlessly categorize your spending based on where you shop',
      'Enhanced Security: Help us verify transaction locations to protect your account',
    ],
    color: 'text-green-400',
    iconBg: 'bg-green-500/10',
  },
  {
    id: 'notification',
    icon: Bell,
    title: 'Push Notifications',
    description: 'Stay on top of your finances',
    benefits: [
      'Smart Reminders: Never miss a payment with smart reminders',
      'Spending Alerts: Receive alerts for unusual spending activity',
      'AI Insights: Get personalized AI insights to help you save',
    ],
    color: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    id: 'sms',
    icon: MessageSquare,
    title: 'SMS Access',
    description: 'Automate your finances with SMS',
    benefits: [
      'Automated Card Entry: Skip manual entry by parsing card details from bank SMS',
      'Simplified Expense Tracking: Automatically track expenses from SMS transaction alerts',
      'Bill Payment Reminders: Get timely bill payment reminders via SMS',
    ],
    color: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
];

export default function UnifiedPermissionsStep({
  onNext,
  onSkip,
  onUpdateFormData,
}: UnifiedPermissionsStepProps) {
  const [permissions, setPermissions] = useState<
    Record<string, PermissionStatus>
  >({
    location: 'pending',
    notification: 'pending',
    sms: 'pending',
  });
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = async (permissionId: string) => {
    setIsLoading(true);

    try {
      let granted = false;

      if (permissionId === 'notification') {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          granted = permission === 'granted';

          if (granted) {
            // Show a test notification
            new Notification('FinMatter', {
              body: "Welcome to FinMatter! We'll keep you updated on your credit card rewards.",
              icon: '/icons/icon-192x192.png',
            });
          }
        }
      } else if (permissionId === 'location') {
        if ('geolocation' in navigator) {
          try {
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            granted = true;
          } catch {
            granted = false;
          }
        }
      } else if (permissionId === 'sms') {
        // SMS permission is browser-specific and not widely supported
        // For web apps, this would typically be handled by the backend/native app
        // For now, we'll just mark it as granted if user clicks
        granted = true;
      }

      setPermissions(prev => ({
        ...prev,
        [permissionId]: granted ? 'granted' : 'denied',
      }));

      // Update parent form data
      onUpdateFormData({
        notificationsEnabled:
          permissionId === 'notification'
            ? granted
            : permissions.notification === 'granted',
        locationEnabled:
          permissionId === 'location'
            ? granted
            : permissions.location === 'granted',
        smsEnabled:
          permissionId === 'sms' ? granted : permissions.sms === 'granted',
      });
    } catch (error) {
      setPermissions(prev => ({
        ...prev,
        [permissionId]: 'denied',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionIcon = (status: PermissionStatus) => {
    if (status === 'granted') {
      return <CheckCircle className='w-5 h-5 text-green-500' />;
    } else if (status === 'denied') {
      return <XCircle className='w-5 h-5 text-error-500' />;
    }
    return null;
  };

  const allGranted = Object.values(permissions).every(
    status => status === 'granted',
  );
  const someGranted = Object.values(permissions).some(
    status => status === 'granted',
  );

  return (
    <div className='min-h-screen bg-background-dark flex items-center justify-center px-4 py-8'>
      <div className='max-w-2xl w-full space-y-8'>
        {/* Header */}
        <div className='text-center space-y-3'>
          <h1 className='text-3xl font-bold text-white'>Enable Permissions</h1>
          <p className='text-base text-gray-400'>
            Allow FinMatter to provide you with the best experience
          </p>
        </div>

        {/* Permissions Cards */}
        <div className='space-y-4'>
          {PERMISSIONS.map(permission => {
            const Icon = permission.icon;
            const status = permissions[permission.id];

            return (
              <div
                key={permission.id}
                className='bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 space-y-4 transition-all hover:border-gray-700'
              >
                {/* Header */}
                <div className='flex items-start justify-between'>
                  <div className='flex items-start gap-4'>
                    <div
                      className={`w-12 h-12 rounded-xl ${permission.iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-6 h-6 ${permission.color}`} />
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='font-semibold text-white text-lg'>
                          {permission.title}
                        </h3>
                        {getPermissionIcon(status)}
                      </div>
                      <p className='text-sm text-gray-400'>
                        {permission.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className='space-y-2 pl-16'>
                  {permission.benefits.map((benefit, index) => {
                    const [title, ...descParts] = benefit.split(':');
                    const description = descParts.join(':').trim();

                    return (
                      <div key={index} className='flex items-start gap-3'>
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${permission.color} mt-2 flex-shrink-0`}
                        />
                        <p className='text-sm text-gray-300'>
                          <span className='font-medium text-white'>
                            {title}:
                          </span>{' '}
                          {description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Action Button */}
                {status === 'pending' && (
                  <div className='pl-16'>
                    <Button
                      onClick={() => requestPermission(permission.id)}
                      disabled={isLoading}
                      className='h-10 px-6 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium'
                    >
                      {isLoading
                        ? 'Requesting...'
                        : `Enable ${permission.title}`}
                    </Button>
                  </div>
                )}

                {status === 'granted' && (
                  <div className='pl-16'>
                    <p className='text-sm text-green-400 font-medium'>
                      ✓ Permission granted
                    </p>
                  </div>
                )}

                {status === 'denied' && (
                  <div className='pl-16'>
                    <p className='text-sm text-gray-500'>
                      Permission denied. You can enable it later in settings.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Privacy Note */}
        <div className='bg-gray-800/30 rounded-xl border border-gray-700 p-4'>
          <p className='text-xs text-gray-400 text-center'>
            Your privacy is important. You can manage your preferences in
            Settings at any time. Your data is encrypted and never shared.
          </p>
        </div>

        {/* Action Buttons */}
        <div className='space-y-3'>
          <Button
            onClick={onNext}
            disabled={!someGranted}
            className='w-full h-14 bg-primary hover:opacity-90 text-white font-semibold rounded-xl disabled:opacity-40 transition-all'
          >
            {allGranted
              ? 'All Set! Continue'
              : someGranted
                ? 'Continue'
                : 'Continue'}
          </Button>

          <Button
            variant='outline'
            onClick={onSkip}
            className='w-full h-14 border-2 border-gray-700 hover:border-gray-600 bg-transparent text-gray-300 rounded-xl'
          >
            Not Now
          </Button>
        </div>
      </div>
    </div>
  );
}
