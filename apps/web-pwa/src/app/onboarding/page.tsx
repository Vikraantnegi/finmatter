'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/hooks/useAuth';

// Import onboarding steps
import ProfileSetup from '@/components/onboarding/ProfileSetup';
import LocationPermissionStep from '@/components/onboarding/LocationPermissionStep';
import NotificationPermissionStep from '@/components/onboarding/NotificationPermissionStep';
import SMSPermissionStep from '@/components/onboarding/SMSPermissionStep';
import { OnboardingSteps } from '@finmatter/types/src/user';

const OnboardingContent = () => {
  const { currentStep, isLoading, nextStep, updateFormData } = useOnboarding();
  const { onboardingCompleted } = useAuth();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case OnboardingSteps.PROFILE:
        return (
          <ProfileSetup
            onComplete={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
      case OnboardingSteps.LOCATION:
        return (
          <LocationPermissionStep
            onNext={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
      case OnboardingSteps.NOTIFICATION:
        return (
          <NotificationPermissionStep
            onNext={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
      case OnboardingSteps.SMS:
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

  if (isLoading || onboardingCompleted) {
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
};

const OnboardingPage = () => {
  return (
    <AuthGuard requireAuth={true} requireOnboarding={false}>
      <OnboardingContent />
    </AuthGuard>
  );
};

export default OnboardingPage;
