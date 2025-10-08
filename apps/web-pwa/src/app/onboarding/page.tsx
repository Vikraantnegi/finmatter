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
  const { currentStep, isLoading, nextStep } = useOnboarding();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center gradient-bg'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} />;
      case 'name':
        return <NameStep onNext={nextStep} onSkip={nextStep} />;
      case 'permissions':
        return <PermissionsStep onNext={nextStep} onSkip={nextStep} />;
      case 'tutorial':
        return <TutorialStep onNext={nextStep} onSkip={nextStep} />;
      case 'addCard':
        return <AddFirstCardStep onComplete={nextStep} onSkip={nextStep} />;
      default:
        return <WelcomeStep onNext={nextStep} />;
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 to-primary-100'>
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
