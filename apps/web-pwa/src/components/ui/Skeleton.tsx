/**
 * Skeleton Loading Components
 * Better UX than spinners - shows content structure while loading
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base Skeleton component
 */
export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'wave':
        return 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';
      case 'pulse':
        return 'animate-pulse bg-gray-200';
      case 'none':
      default:
        return 'bg-gray-200';
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height)
    style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${getVariantClasses()} ${getAnimationClasses()} ${className}`}
      style={style}
    />
  );
}

/**
 * Card Skeleton - Mimics CardVisual component
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Card Visual Skeleton */}
      <div className='relative h-48 p-6 bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse'>
        {/* Top row */}
        <div className='flex justify-between items-start mb-4'>
          <Skeleton variant='rectangular' width={60} height={24} />
          <div className='text-right'>
            <Skeleton width={40} height={12} className='mb-1' />
            <Skeleton width={80} height={20} />
          </div>
        </div>

        {/* Bottom row */}
        <div className='absolute bottom-6 left-6 right-6'>
          <Skeleton width={100} height={12} className='mb-2' />
          <Skeleton width={150} height={20} className='mb-4' />
          <Skeleton width={120} height={16} />
        </div>
      </div>

      {/* Card Info Skeleton */}
      <div className='p-4 space-y-3'>
        {[1, 2, 3].map(i => (
          <div key={i} className='flex justify-between items-center'>
            <Skeleton width={80} height={16} />
            <Skeleton width={100} height={16} />
          </div>
        ))}
        <Skeleton width='100%' height={40} className='mt-4' />
      </div>
    </div>
  );
}

/**
 * Card List Skeleton - Shows multiple card skeletons
 */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Stats Card Skeleton - For dashboard stats
 */
export function StatsCardSkeleton() {
  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
      <div className='flex items-center justify-between mb-4'>
        <Skeleton variant='circular' width={40} height={40} />
        <Skeleton width={60} height={20} />
      </div>
      <Skeleton width='60%' height={16} className='mb-2' />
      <Skeleton width='80%' height={32} />
    </div>
  );
}

/**
 * Table Row Skeleton - For transaction lists
 */
export function TableRowSkeleton() {
  return (
    <div className='flex items-center gap-4 py-4 border-b border-gray-200'>
      <Skeleton variant='circular' width={40} height={40} />
      <div className='flex-1'>
        <Skeleton width='60%' height={16} className='mb-2' />
        <Skeleton width='40%' height={12} />
      </div>
      <Skeleton width={80} height={20} />
    </div>
  );
}

/**
 * Page Skeleton - Full page loading state
 */
export function PageSkeleton() {
  return (
    <div className='min-h-screen bg-white p-4'>
      {/* Header */}
      <div className='max-w-7xl mx-auto mb-8'>
        <Skeleton width={200} height={32} className='mb-2' />
        <Skeleton width={300} height={16} />
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto'>
        <div className='grid md:grid-cols-3 gap-6 mb-8'>
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        <CardListSkeleton count={6} />
      </div>
    </div>
  );
}
