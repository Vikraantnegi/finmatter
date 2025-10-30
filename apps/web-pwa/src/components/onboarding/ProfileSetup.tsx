'use client';

import { useState } from 'react';
import ProfileNameStep from './ProfileNameStep';
import ProfileAvatarStep from './ProfileAvatarStep';

export type ProfileFormData = {
  firstName: string;
  lastName?: string;
  avatar?: string;
};

interface ProfileSetupProps {
  onComplete: (data: ProfileFormData) => void;
  onUpdateFormData: (updates: Partial<ProfileFormData>) => void;
}

export default function ProfileSetup({
  onComplete,
  onUpdateFormData,
}: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [stepCompleted, setStepCompleted] = useState({
    step1: false,
    step2: false,
  });
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    avatar: '',
  });

  const handleNameComplete = (data: {
    firstName: string;
    lastName?: string;
  }) => {
    const updated = { ...formData, ...data };
    setFormData(updated);
    onUpdateFormData(updated);
    setStepCompleted(prev => ({ ...prev, step1: true }));
    setCurrentStep(2);
  };

  const handleAvatarComplete = (avatar?: string) => {
    const updated = { ...formData, avatar };
    setFormData(updated);
    onUpdateFormData(updated);
    setStepCompleted(prev => ({ ...prev, step2: true }));
    onComplete(updated);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  // Calculate progress: 0 → 50 → 100
  const progress = stepCompleted.step2 ? 100 : stepCompleted.step1 ? 50 : 0;

  return (
    <div className='min-h-screen bg-background-dark relative px-8'>
      {/* Progress Indicator - Sleek & Simple */}
      <div className='absolute inset-x-0 top-0 z-10'>
        <div className='px-8 py-6'>
          {/* Progress Bar */}
          <div className='relative h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2'>
            <div
              className='absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-700 ease-out'
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Counter - Below Progress Bar */}
          <div className='flex items-center justify-end'>
            <span className='text-xs font-medium text-gray-500'>
              {currentStep}/2
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='h-screen'>
        {currentStep === 1 && <ProfileNameStep onNext={handleNameComplete} />}
        {currentStep === 2 && (
          <ProfileAvatarStep
            onNext={handleAvatarComplete}
            onBack={handleBack}
            firstName={formData.firstName}
            lastName={formData.lastName}
          />
        )}
      </div>
    </div>
  );
}
