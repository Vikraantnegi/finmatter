/**
 * Empty State Component
 * Reusable component for displaying empty states with icons and actions
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  iconSize?: number;
  iconColor?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  iconSize = 64,
  iconColor = '#9CA3AF',
}) => {
  return (
    <View className='flex-1 justify-center items-center px-8 py-12'>
      {/* Icon */}
      <View className='mb-6'>
        <Icon size={iconSize} color={iconColor} />
      </View>

      {/* Title */}
      <Text className='text-xl font-bold text-text mb-3 text-center'>
        {title}
      </Text>

      {/* Description */}
      <Text className='text-base text-text-secondary text-center leading-6 mb-8 max-w-sm'>
        {description}
      </Text>

      {/* Action Button */}
      {actionText && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className='bg-primary px-8 py-4 rounded-lg'
          activeOpacity={0.8}
        >
          <Text className='text-white font-semibold text-base'>
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;
