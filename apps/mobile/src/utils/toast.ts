/**
 * Toast utility functions for consistent toast messaging
 */

import Toast from 'react-native-toast-message';

/**
 * Show success toast
 */
export const showSuccessToast = (title: string, message?: string) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 60,
  });
};

/**
 * Show error toast
 */
export const showErrorToast = (title: string, message?: string) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 60,
  });
};

/**
 * Show info toast
 */
export const showInfoToast = (title: string, message?: string) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 60,
  });
};

/**
 * Hide all toasts
 */
export const hideToast = () => {
  Toast.hide();
};
