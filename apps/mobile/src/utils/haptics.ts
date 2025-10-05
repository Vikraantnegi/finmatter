/**
 * Haptic Feedback Utilities
 * Provides haptic feedback for user interactions
 */

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Haptic feedback options
const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const haptics = {
  /**
   * Light haptic feedback for button presses
   */
  light: () => {
    ReactNativeHapticFeedback.trigger('impactLight', options);
  },

  /**
   * Medium haptic feedback for important actions
   */
  medium: () => {
    ReactNativeHapticFeedback.trigger('impactMedium', options);
  },

  /**
   * Heavy haptic feedback for significant events
   */
  heavy: () => {
    ReactNativeHapticFeedback.trigger('impactHeavy', options);
  },

  /**
   * Success haptic feedback
   */
  success: () => {
    ReactNativeHapticFeedback.trigger('notificationSuccess', options);
  },

  /**
   * Warning haptic feedback
   */
  warning: () => {
    ReactNativeHapticFeedback.trigger('notificationWarning', options);
  },

  /**
   * Error haptic feedback
   */
  error: () => {
    ReactNativeHapticFeedback.trigger('notificationError', options);
  },

  /**
   * Selection haptic feedback
   */
  selection: () => {
    ReactNativeHapticFeedback.trigger('selection', options);
  },
};

export default haptics;
