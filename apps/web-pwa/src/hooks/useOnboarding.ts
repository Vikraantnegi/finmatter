'use client';

import { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './useAuth';

export type OnboardingStep =
  | 'welcome'
  | 'name'
  | 'permissions'
  | 'tutorial'
  | 'addCard';

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(
    new Set(),
  );
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    notificationsEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const { completeOnboarding } = useAuth();

  const steps: OnboardingStep[] = useMemo(
    () => ['welcome', 'tutorial', 'name', 'permissions', 'addCard'],
    [],
  );

  // Define which steps are required
  const requiredSteps: OnboardingStep[] = useMemo(
    () => ['welcome', 'name'],
    [],
  );

  const currentStepIndex = steps.indexOf(currentStep);

  const completeOnboardingFlow = useCallback(async () => {
    // Validate required fields
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      setCurrentStep('name');
      return;
    }

    // Validate minimum steps completed
    const missingRequiredSteps = requiredSteps.filter(
      step => !completedSteps.has(step),
    );

    if (missingRequiredSteps.length > 0) {
      toast.error('Please complete all required steps');
      setCurrentStep(missingRequiredSteps[0]);
      return;
    }

    try {
      setIsLoading(true);
      const result = await completeOnboarding({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName?.trim() || undefined,
        notificationsEnabled: formData.notificationsEnabled,
      });

      if (!result.success) {
        toast.error('Failed to complete onboarding. Please try again.');
      }
    } catch (error) {
      // Error handled by component
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, completedSteps, requiredSteps, completeOnboarding]);

  const nextStep = useCallback(() => {
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    } else {
      // Complete onboarding
      completeOnboardingFlow();
    }
  }, [currentStep, currentStepIndex, steps, completeOnboardingFlow]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  }, [currentStepIndex, steps]);

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  const skipTutorial = useCallback(() => {
    // Skip to add card step
    setCurrentStep('addCard');
  }, []);

  const updateFormData = useCallback((updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'name':
        return formData.firstName.trim().length > 0;
      case 'permissions':
      case 'tutorial':
        return true;
      case 'addCard':
        return true; // Optional step
      default:
        return true;
    }
  }, [currentStep, formData.firstName]);

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return {
    // State
    currentStep,
    currentStepIndex,
    completedSteps,
    formData,
    isLoading,
    progress,
    canProceed: canProceed(),

    // Actions
    nextStep,
    prevStep,
    goToStep,
    skipTutorial,
    updateFormData,
    completeOnboardingFlow,

    // Computed
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
    totalSteps: steps.length,
    requiredSteps,
  };
}
