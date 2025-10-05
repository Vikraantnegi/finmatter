/* eslint-disable react-native/no-inline-styles */
/**
 * Toast Configuration for FinMatter
 * Custom toast styles and configurations
 */

import React from 'react';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

/**
 * Custom Success Toast Component
 */
const SuccessToast = (props: any) => (
  <BaseToast
    {...props}
    style={{
      borderLeftColor: '#10B981',
      backgroundColor: '#ECFDF5',
      borderRadius: 8,
      borderLeftWidth: 4,
    }}
    contentContainerStyle={{
      paddingHorizontal: 16,
    }}
    text1Style={{
      fontSize: 16,
      fontWeight: '600',
      color: '#065F46',
    }}
    text2Style={{
      fontSize: 14,
      color: '#047857',
    }}
  />
);

/**
 * Custom Error Toast Component
 */
const CustomErrorToast = (props: any) => (
  <ErrorToast
    {...props}
    style={{
      borderLeftColor: '#EF4444',
      backgroundColor: '#FEF2F2',
      borderRadius: 8,
      borderLeftWidth: 4,
    }}
    contentContainerStyle={{
      paddingHorizontal: 16,
    }}
    text1Style={{
      fontSize: 16,
      fontWeight: '600',
      color: '#991B1B',
    }}
    text2Style={{
      fontSize: 14,
      color: '#DC2626',
    }}
  />
);

/**
 * Custom Info Toast Component
 */
const InfoToast = (props: any) => (
  <BaseToast
    {...props}
    style={{
      borderLeftColor: '#3B82F6',
      backgroundColor: '#EFF6FF',
      borderRadius: 8,
      borderLeftWidth: 4,
    }}
    contentContainerStyle={{
      paddingHorizontal: 16,
    }}
    text1Style={{
      fontSize: 16,
      fontWeight: '600',
      color: '#1E40AF',
    }}
    text2Style={{
      fontSize: 14,
      color: '#2563EB',
    }}
  />
);

// Toast configuration
const toastConfig = {
  success: SuccessToast,
  error: CustomErrorToast,
  info: InfoToast,
};

/**
 * Toast Component with Configuration
 */
export const ToastComponent = () => {
  return <Toast config={toastConfig} position='top' topOffset={60} />;
};
