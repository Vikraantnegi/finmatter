'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useOnboarding } from '@/hooks/useOnboarding';

// Import onboarding steps
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import NameStep from '@/components/onboarding/NameStep';
import PermissionsStep from '@/components/onboarding/PermissionsStep';
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
      case 'name':
        return <NameStep onNext={nextStep} onUpdateFormData={updateFormData} />;
      case 'permissions':
        return (
          <PermissionsStep
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
      <div className='min-h-screen gradient-bg flex items-center justify-center'>
        <div className='bg-white rounded-2xl p-8 max-w-sm mx-4 shadow-2xl'>
          <div className='flex flex-col items-center space-y-4'>
            <LoadingSpinner size='lg' />
            <div className='text-center'>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Setting up your account
              </h3>
              <p className='text-gray-600 text-sm'>
                Please wait while we complete your onboarding...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 relative'>
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
