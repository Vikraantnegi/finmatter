'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MessageSquare, CreditCard, Receipt, BellRing } from 'lucide-react';

interface SMSPermissionStepProps {
  onNext: (granted: boolean) => void;
  onUpdateFormData: (updates: { smsEnabled: boolean }) => void;
}

export const SMSPermissionStep = ({
  onNext,
  onUpdateFormData,
}: SMSPermissionStepProps) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      // In a real PWA/mobile app, you would request SMS permissions here
      // For now, we'll simulate approval
      await new Promise(resolve => setTimeout(resolve, 1000));
      const granted = true; // Simulate user granting permission

      onUpdateFormData({ smsEnabled: granted });
      onNext(granted);
    } catch (error) {
      onUpdateFormData({ smsEnabled: false });
      onNext(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onUpdateFormData({ smsEnabled: false });
    onNext(false);
  };

  return (
    <div className='min-h-screen bg-background-dark flex items-center justify-center px-6'>
      <div className='max-w-md w-full space-y-8 py-8'>
        {/* Progress Dots */}
        <div className='flex justify-center gap-2 mb-4'>
          <div className='w-2 h-2 rounded-full bg-gray-700' />
          <div className='w-2 h-2 rounded-full bg-gray-700' />
          <div className='w-2 h-2 rounded-full bg-blue-500' />
        </div>

        {/* Icon/Visual */}
        <div className='flex justify-center'>
          <div className='w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/20'>
            <MessageSquare className='w-16 h-16 text-blue-500' />
          </div>
        </div>

        {/* Header */}
        <div className='text-center space-y-3'>
          <h1 className='text-3xl font-bold text-white'>
            Automate Your Finances with SMS
          </h1>
          <p className='text-base text-gray-400'>
            Let FinMatter securely read your transaction SMS to automate expense
            tracking and card management
          </p>
        </div>

        {/* Benefits */}
        <div className='space-y-4 bg-gray-900/50 rounded-2xl p-6 border border-gray-800'>
          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0'>
              <CreditCard className='w-5 h-5 text-blue-500' />
            </div>
            <div>
              <h3 className='text-white font-semibold mb-1'>
                Automated Card Entry
              </h3>
              <p className='text-sm text-gray-400'>
                Skip manual entry by parsing card details from bank SMS
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0'>
              <Receipt className='w-5 h-5 text-blue-500' />
            </div>
            <div>
              <h3 className='text-white font-semibold mb-1'>
                Simplified Expense Tracking
              </h3>
              <p className='text-sm text-gray-400'>
                Automatically track expenses from SMS transaction alerts
              </p>
            </div>
          </div>

          <div className='flex items-start gap-4'>
            <div className='w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0'>
              <BellRing className='w-5 h-5 text-blue-500' />
            </div>
            <div>
              <h3 className='text-white font-semibold mb-1'>
                Bill Payment Reminders
              </h3>
              <p className='text-sm text-gray-400'>
                Get timely bill payment reminders via SMS
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
            Maybe Later
          </Button>

          <Button
            onClick={handleEnable}
            disabled={isRequesting}
            className='flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-40 transition-all'
          >
            {isRequesting ? 'Enabling...' : 'Enable SMS'}
          </Button>
        </div>

        {/* Privacy Note */}
        <p className='text-xs text-gray-500 text-center leading-relaxed'>
          Your data is encrypted and never shared. You have full control in your
          settings.
        </p>
      </div>
    </div>
  );
};

export default SMSPermissionStep;
