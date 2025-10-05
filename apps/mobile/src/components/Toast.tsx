/**
 * Toast Configuration for FinMatter
 * Custom toast styles and configurations
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { theme } from '../constants/theme';

/**
 * Custom Success Toast Component
 */
const SuccessToast = (props: any) => (
  <BaseToast
    {...props}
    style={styles.successToast}
    contentContainerStyle={styles.contentContainer}
    text1Style={styles.text1}
    text2Style={styles.text2}
  />
);

/**
 * Custom Error Toast Component
 */
const CustomErrorToast = (props: any) => (
  <ErrorToast
    {...props}
    style={styles.errorToast}
    contentContainerStyle={styles.contentContainer}
    text1Style={styles.text1}
    text2Style={styles.text2}
  />
);

/**
 * Custom Info Toast Component
 */
const InfoToast = (props: any) => (
  <BaseToast
    {...props}
    style={styles.infoToast}
    contentContainerStyle={styles.contentContainer}
    text1Style={styles.text1}
    text2Style={styles.text2}
  />
);

/**
 * Toast Configuration
 */
const toastConfig = {
  success: SuccessToast,
  error: CustomErrorToast,
  info: InfoToast,
};

const styles = StyleSheet.create({
  successToast: {
    borderLeftColor: theme.colors.success,
    borderLeftWidth: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorToast: {
    borderLeftColor: theme.colors.error,
    borderLeftWidth: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoToast: {
    borderLeftColor: theme.colors.info,
    borderLeftWidth: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  text1: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  text2: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

/**
 * Toast Component with Configuration
 */
export const ToastComponent: React.FC = () => {
  return <Toast config={toastConfig} />;
};

export default ToastComponent;
