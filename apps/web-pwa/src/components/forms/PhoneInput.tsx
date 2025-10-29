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
        const cleanValue = inputValue.replace(/\D/g, '').slice(0, 10);

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
        <div className='relative flex items-center rounded-xl border border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200'>
          <div className='flex items-center justify-center px-4 py-3 bg-transparent border-r border-gray-600'>
            <span className='text-lg mr-2'>🇮🇳</span>
            <span className='text-base font-medium text-gray-300'>+91</span>
          </div>
          <input
            {...props}
            ref={ref}
            onChange={handleChange}
            type='tel'
            maxLength={10}
            placeholder='1234567890'
            className={cn(
              'flex-1 px-4 py-3 bg-transparent rounded-r-xl border-0 focus:outline-none text-white placeholder:text-gray-500',
              error && 'text-error-400',
              className,
            )}
          />
        </div>
        {error && <p className='text-sm text-error-400 mt-1'>{error}</p>}
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';
