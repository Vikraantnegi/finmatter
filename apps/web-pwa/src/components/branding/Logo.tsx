import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const iconSizes = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
};

/**
 * FinMatter Logo Component
 * Displays the piggy bank icon with optional text
 */
const Logo = ({
  className = '',
  showText = true,
  iconSize = 'md',
}: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`material-symbols-outlined text-primary ${iconSizes[iconSize]}`}
      >
        savings
      </span>
      {showText && (
        <span className='text-xl font-bold text-gray-800 dark:text-white'>
          FinMatter
        </span>
      )}
    </div>
  );
};

export default Logo;
