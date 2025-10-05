/**
 * Biometric Prompt Component
 * Handles biometric authentication on app launch for users with biometric enabled
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { theme } from '../constants/theme';
import { showErrorToast } from '../utils/toast';

interface BiometricPromptProps {
  isVisible: boolean;
  onSuccess: () => void;
  onFallback: () => void;
  onCancel: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  isVisible,
  onSuccess,
  onFallback,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      handleBiometricAuth();
    }
  }, [isVisible]);

  const handleBiometricAuth = async () => {
    try {
      setIsLoading(true);

      const rnBiometrics = new ReactNativeBiometrics({
        allowDeviceCredentials: true,
      });

      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Use biometric to unlock FinMatter',
        cancelButtonText: 'Use Password',
      });

      if (success) {
        onSuccess();
      } else {
        onCancel();
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      showErrorToast(
        'Biometric Error',
        'Failed to authenticate. Please try again.',
      );
      onFallback();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Unlock FinMatter</Text>
          <Text style={styles.subtitle}>
            Use your biometric to continue securely
          </Text>

          {isLoading && (
            <Text style={styles.loadingText}>Authenticating...</Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={onFallback}
              disabled={isLoading}
            >
              <Text style={styles.fallbackButtonText}>Use Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: screenWidth * 0.8,
    maxWidth: 400,
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: theme.spacing.md,
    width: '100%',
  },
  fallbackButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  fallbackButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
    fontWeight: theme.typography.weights.semibold,
  },
  cancelButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
});

export default BiometricPrompt;
