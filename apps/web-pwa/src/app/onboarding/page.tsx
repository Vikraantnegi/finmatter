'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useOnboarding } from '@/hooks/useOnboarding';

// Import onboarding steps
import ProfileSetup from '@/components/onboarding/ProfileSetup';
import LocationPermissionStep from '@/components/onboarding/LocationPermissionStep';
import NotificationPermissionStep from '@/components/onboarding/NotificationPermissionStep';
import SMSPermissionStep from '@/components/onboarding/SMSPermissionStep';

function OnboardingContent() {
  const { currentStep, isLoading, nextStep, updateFormData } = useOnboarding();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'profile':
        return (
          <ProfileSetup
            onComplete={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
      case 'location':
        return (
          <LocationPermissionStep
            onNext={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
      case 'notification':
        return (
          <NotificationPermissionStep
            onNext={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
      case 'sms':
        return (
          <SMSPermissionStep
            onNext={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
      default:
        return (
          <ProfileSetup
            onComplete={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
    }
  };

  // Show full-screen loading during onboarding completion to prevent any flashing
  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center px-4'>
        <div className='text-center space-y-4'>
          <LoadingSpinner size='lg' className='mx-auto' />
          <p className='text-base text-gray-300'>Curating your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background-dark relative'>
      {renderCurrentStep()}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={false}>
      <OnboardingContent />
    </AuthGuard>
  );
}
