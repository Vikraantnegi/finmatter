/**
 * Loading Spinner Component
 * Shows loading animation during API calls
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

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
  color = theme.colors.primary,
  overlay = false,
}) => {
  if (!isLoading) {
    return null;
  }

  const content = (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  if (overlay) {
    return <View style={styles.overlay}>{content}</View>;
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default LoadingSpinner;
