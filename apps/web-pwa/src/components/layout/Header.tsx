'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { Logo } from '@/components/branding/Logo';

interface HeaderProps {
  showBackButton?: boolean;
  showHelpButton?: boolean;
  onBack?: () => void;
  onHelp?: () => void;
  className?: string;
}

/**
 * Common header component for auth flows, tutorial, and onboarding screens
 * Features the FinMatter piggy bank logo and app name
 */
export function Header({
  showBackButton = false,
  showHelpButton = false,
  onBack,
  onHelp,
  className = '',
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleHelp = () => {
    if (onHelp) {
      onHelp();
    }
  };

  return (
    <header
      className={`flex h-20 w-full shrink-0 items-center justify-between px-4 z-10 ${className}`}
    >
      {showBackButton ? (
        <button
          onClick={handleBack}
          className='h-6 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800'
          aria-label='Go back'
        >
          <span className='material-symbols-outlined text-2xl'>arrow_back</span>
        </button>
      ) : (
        <div />
      )}

      <div className='absolute left-1/2 transform -translate-x-1/2'>
        <Logo iconSize='lg' showText={true} />
      </div>

      {showHelpButton ? (
        <button
          onClick={handleHelp}
          className='w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors ml-auto'
          aria-label='Help'
        >
          <span className='material-symbols-outlined text-xl'>help</span>
        </button>
      ) : (
        <div className='w-10' />
      )}
    </header>
  );
}
