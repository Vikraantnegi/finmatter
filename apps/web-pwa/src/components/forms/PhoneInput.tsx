'use client';

import React, { useCallback, forwardRef } from 'react';
import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface PhoneInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, error, className, ...props }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const cleanValue = inputValue.replace(/\s/g, '');

        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            name: e.target.name,
            value: cleanValue,
          },
        };

        onChange?.(syntheticEvent);
      },
      [onChange],
    );

    return (
      <div className='space-y-2'>
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <span className='text-gray-500 text-base'>🇮🇳 +91</span>
          </div>
          <input
            {...props}
            ref={ref}
            onChange={handleChange}
            maxLength={10}
            placeholder='XXXXX XXXXX'
            className={cn(
              'input pl-20 text-gray-900',
              error && 'border-error-500 focus:ring-error-500',
              className,
            )}
          />
        </div>
        {error && <p className='text-sm text-error-600'>{error}</p>}
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';
