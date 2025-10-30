'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useOnboarding } from '@/hooks/useOnboarding';

// Import onboarding steps
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import ProfileSetup from '@/components/onboarding/ProfileSetup';
import UnifiedPermissionsStep from '@/components/onboarding/UnifiedPermissionsStep';
import TutorialStep from '@/components/onboarding/TutorialStep';
import AddFirstCardStep from '@/components/onboarding/AddFirstCardStep';

function OnboardingContent() {
  const { currentStep, isLoading, nextStep, updateFormData } = useOnboarding();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} />;
      case 'tutorial':
        return <TutorialStep onNext={nextStep} onSkip={nextStep} />;
      case 'profile':
        return (
          <ProfileSetup
            onComplete={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
      case 'permissions':
        return (
          <UnifiedPermissionsStep
            onNext={nextStep}
            onSkip={nextStep}
            onUpdateFormData={updateFormData}
          />
        );
      case 'addCard':
        return <AddFirstCardStep onComplete={nextStep} onSkip={nextStep} />;
      default:
        return <WelcomeStep onNext={nextStep} />;
    }
  };

  // Show full-screen loading during onboarding completion to prevent any flashing
  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center px-4'>
        <div className='text-center space-y-4'>
          <LoadingSpinner size='lg' className='mx-auto' />
          <p className='text-base text-gray-300'>
            Setting up your dashboard...
          </p>
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
