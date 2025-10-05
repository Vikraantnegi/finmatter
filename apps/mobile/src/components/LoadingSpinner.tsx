/**
 * Loading Spinner Component
 * Shows loading animation during API calls
 */

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  isLoading: boolean;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isLoading,
  message = 'Loading...',
  size = 'large',
  color = '#3B82F6',
  overlay = false,
}) => {
  if (!isLoading) {
    return null;
  }

  const content = (
    <View className='flex-row items-center justify-center p-4 gap-2'>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className='text-base text-text-secondary ml-2'>{message}</Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <View className='absolute inset-0 bg-white/90 justify-center items-center z-[1000]'>
        {content}
      </View>
    );
  }

  return content;
};

export default LoadingSpinner;
