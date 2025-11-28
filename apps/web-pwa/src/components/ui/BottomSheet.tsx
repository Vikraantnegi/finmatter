'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: number[]; // Percentage heights [min, max]
  className?: string; // Additional classes for custom styling
  dark?: boolean; // Dark theme variant
}

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  dark = false,
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [currentY, setCurrentY] = React.useState(0);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY - startY);
  };

  const handleTouchEnd = () => {
    if (currentY > 100) {
      onClose();
    }
    setIsDragging(false);
    setCurrentY(0);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-[100] bg-black bg-opacity-50 backdrop-blur-sm m-0'
      onClick={handleBackdropClick}
      style={{ touchAction: 'none', margin: 0 }}
    >
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[90vh] flex flex-col pb-safe-area-inset-bottom',
          dark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900',
          className,
        )}
        style={{
          transform: isDragging
            ? `translateY(${Math.max(0, currentY)}px)`
            : isOpen
              ? 'translateY(0)'
              : 'translateY(100%)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))', // Account for bottom navigation with safe spacing
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className='flex justify-center pt-3 pb-2'>
          <div
            className={cn(
              'w-12 h-1.5 rounded-full',
              dark ? 'bg-gray-600' : 'bg-gray-300',
            )}
          />
        </div>

        {/* Header */}
        {title && (
          <div
            className={cn(
              'flex items-center justify-between px-6 py-4 border-b',
              dark ? 'border-gray-700' : 'border-gray-200',
            )}
          >
            <h3
              className={cn(
                'text-base font-semibold',
                dark ? 'text-white' : 'text-gray-900',
              )}
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              className={cn(
                'transition-colors p-2 -mr-2',
                dark
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        )}

        {/* Content */}
        <div className='flex-1 overflow-y-auto overscroll-contain'>
          {children}
        </div>
      </div>
    </div>
  );
};
