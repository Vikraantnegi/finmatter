'use client';

import React from 'react';
import Image from 'next/image';
import {
  generateAvatarData,
  isEmojiAvatar,
  isImageUrl,
} from '@/lib/avatarUtils';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
  '2xl': 'w-24 h-24 text-4xl',
};

/**
 * Avatar Component
 * Displays user avatar with intelligent fallback to initials
 *
 * Priority:
 * 1. Custom uploaded image (URL)
 * 2. Preset emoji avatar
 * 3. Initials with colored background (default)
 */
export function Avatar({ name, avatar, size = 'md', className }: AvatarProps) {
  const avatarData = generateAvatarData(name, avatar);
  const isEmoji = isEmojiAvatar(avatar);
  const isImage = isImageUrl(avatar);

  // Show uploaded image
  if (isImage && avatar) {
    return (
      <div
        className={cn(
          'relative rounded-full overflow-hidden flex-shrink-0',
          sizeClasses[size],
          className,
        )}
      >
        <Image src={avatar} alt={name} fill className='object-cover' />
      </div>
    );
  }

  // Show emoji avatar
  if (isEmoji && avatar) {
    return (
      <div
        className={cn(
          'rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0',
          sizeClasses[size],
          className,
        )}
      >
        <span className='leading-none'>{avatar}</span>
      </div>
    );
  }

  // Show initials with colored background (default)
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        sizeClasses[size],
        className,
      )}
      style={{
        backgroundColor: avatarData.backgroundColor,
        color: avatarData.textColor,
      }}
    >
      {avatarData.initials}
    </div>
  );
}

/**
 * Avatar with border (for profile pages)
 */
export function AvatarWithBorder({
  name,
  avatar,
  size = 'xl',
  className,
}: AvatarProps) {
  return (
    <div className='relative inline-block'>
      <div className='p-1 bg-gradient-to-br from-primary to-blue-400 rounded-full'>
        <div className='bg-background-dark rounded-full p-1'>
          <Avatar
            name={name}
            avatar={avatar}
            size={size}
            className={className}
          />
        </div>
      </div>
    </div>
  );
}
