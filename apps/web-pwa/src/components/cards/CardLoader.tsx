'use client';

import { RefreshCw } from 'lucide-react';

interface CardLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CardLoader = ({ className, size = 'md' }: CardLoaderProps) => {
  const sizeClasses = {
    sm: 'w-32 h-20',
    md: 'w-48 h-32',
    lg: 'w-64 h-40',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-2xl relative overflow-hidden`}
        style={{
          perspective: '1000px',
        }}
      >
        {/* Flipping Animation */}
        <div
          className='absolute inset-0 flex items-center justify-center animate-flip360'
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className='w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center'
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            <RefreshCw className='w-8 h-8 text-white' />
          </div>
        </div>
      </div>
    </div>
  );
};
