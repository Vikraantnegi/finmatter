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
    <div className={`flex items-center justify-center ${className ?? ''}`}>
      <div className={`${sizeClasses[size]} card-loader-scene`}>
        <div className='card-loader-card'>
          <div className='card-loader-face card-loader-face--front'>
            <RefreshCw className='w-8 h-8 text-white card-loader-icon' />
          </div>
          <div className='card-loader-face card-loader-face--back'>
            <RefreshCw className='w-8 h-8 text-white card-loader-icon' />
          </div>
        </div>
      </div>
    </div>
  );
};
