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
    setCurrentStep(2);
  };

  const handleAvatarComplete = (avatar?: string) => {
    const updated = { ...formData, avatar };
    setFormData(updated);
    onUpdateFormData(updated);
    onComplete(updated);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  return (
    <div className='min-h-screen bg-background-dark'>
      {/* Progress Indicator */}
      <div className='fixed top-0 left-0 right-0 z-10 bg-gray-900/95 backdrop-blur-sm'>
        <div className='max-w-2xl mx-auto px-6 py-6'>
          <div className='bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-white'>
                Profile Setup
              </h3>
              <span className='text-base font-medium text-gray-300'>
                Step {currentStep}/2
              </span>
            </div>

            {/* Progress Bar */}
            <div className='relative h-2 bg-gray-700 rounded-full overflow-hidden'>
              <div
                className='absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500 ease-out'
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='pt-32'>
        {currentStep === 1 && <ProfileNameStep onNext={handleNameComplete} />}
        {currentStep === 2 && (
          <ProfileAvatarStep
            onNext={handleAvatarComplete}
            onBack={handleBack}
            currentName={formData.firstName}
          />
        )}
      </div>
    </div>
  );
}
