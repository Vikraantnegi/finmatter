/**
 * Biometric Setup Screen for FinMatter Authentication
 *
 * Features:
 * - Biometric authentication setup after OTP verification
 * - Device capability detection (Face ID, Touch ID, Fingerprint)
 * - Secure storage of biometric preferences
 * - Skip option for users who prefer not to use biometrics
 * - Clear explanation of biometric benefits
 * - Error handling for unsupported devices
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { haptics } from '../../utils/haptics';

// Define BiometryTypes enum locally to avoid type issues
enum BiometryTypes {
  TouchID = 'TouchID',
  FaceID = 'FaceID',
  Biometrics = 'Biometrics',
}
import DeviceInfo from 'react-native-device-info';
import { AuthScreenProps } from '../../navigation/types';
import { theme } from '../../constants/theme';
import { authService } from '../../services/AuthService';

interface BiometricSetupScreenProps extends AuthScreenProps<'BiometricSetup'> {}

/**
 * Biometric type display configuration
 */
const BIOMETRIC_CONFIG = {
  [BiometryTypes.FaceID]: {
    name: 'Face ID',
    icon: '👤',
    description: 'Use your face to unlock the app securely',
  },
  [BiometryTypes.TouchID]: {
    name: 'Touch ID',
    icon: '👆',
    description: 'Use your fingerprint to unlock the app securely',
  },
  [BiometryTypes.Biometrics]: {
    name: 'Biometric',
    icon: '🔐',
    description: 'Use your biometric to unlock the app securely',
  },
};

/**
 * Biometric Setup Screen Component
 *
 * Handles biometric authentication setup after successful OTP verification
 * Provides clear options and explanations for users
 */
export const BiometricSetupScreen: React.FC<BiometricSetupScreenProps> = ({
  navigation,
  route,
}) => {
  const { userId, phoneNumber } = route.params;

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometryTypes | null>(
    null,
  );
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Checks device biometric capabilities on component mount
   */
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  /**
   * Checks if the device supports biometric authentication
   * Determines the available biometric type
   */
  const checkBiometricSupport = useCallback(async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics({
        allowDeviceCredentials: true,
      });

      // Check if biometrics are available
      const { available, biometryType } =
        await rnBiometrics.isSensorAvailable();

      if (available && biometryType) {
        setIsSupported(true);
        setBiometricType(biometryType as BiometryTypes);
      } else {
        setIsSupported(false);
        setBiometricType(null);
      }
    } catch (error) {
      console.error('Biometric check error:', error);
      setIsSupported(false);
      setBiometricType(null);
      setError('Unable to check biometric capabilities');
    }
  }, []);

  /**
   * Gets the current biometric configuration
   */
  const getBiometricConfig = useCallback(() => {
    if (!biometricType) return null;
    return (
      BIOMETRIC_CONFIG[biometricType] ||
      BIOMETRIC_CONFIG[BiometryTypes.Biometrics]
    );
  }, [biometricType]);

  /**
   * Handles biometric setup
   * Creates biometric keys and stores user preference
   */
  const handleSetupBiometric = useCallback(async () => {
    if (!isSupported || !biometricType) {
      setError('Biometric authentication is not available on this device');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const rnBiometrics = new ReactNativeBiometrics({
        allowDeviceCredentials: true,
      });
      const config = getBiometricConfig();

      // Create biometric signature prompt
      const { success } = await rnBiometrics.createSignature({
        promptMessage: `Setup ${config?.name}`,
        payload: `finmatter_user_${userId}`,
      });

      if (success) {
        // Update user preference in database
        const updateResponse = await authService.updateBiometricPreference(
          userId,
          true,
        );

        if (updateResponse.success) {
          haptics.success();
          showSuccessToast(
            `${config?.name} Enabled`,
            `Your ${config?.name} has been set up successfully. You can now use it to unlock the app.`,
          );
          // Navigate to onboarding flow after a short delay
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Onboarding' }],
            });
          }, 1500);
        } else {
          haptics.error();
          setError('Failed to save biometric preference. Please try again.');
        }
      } else {
        haptics.warning();
        setError('Biometric setup was cancelled or failed');
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      setError('Failed to setup biometric authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, biometricType, userId, navigation, getBiometricConfig]);

  /**
   * Handles skipping biometric setup
   * Updates user preference and navigates to main app
   */
  const handleSkipBiometric = useCallback(async () => {
    try {
      setIsLoading(true);

      // Update user preference in database
      const updateResponse = await authService.updateBiometricPreference(
        userId,
        false,
      );

      if (updateResponse.success) {
        // Navigate to onboarding flow
        navigation.reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        });
      } else {
        setError('Failed to save preference. Please try again.');
      }
    } catch (error) {
      console.error('Skip biometric error:', error);
      setError('Failed to save preference. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, navigation]);

  /**
   * Gets the biometric setup content based on device capabilities
   */
  const renderBiometricContent = useCallback(() => {
    if (!isSupported) {
      return (
        <View style={styles.unsupportedContainer}>
          <Text style={styles.unsupportedIcon}>📱</Text>
          <Text style={styles.unsupportedTitle}>Biometric Not Available</Text>
          <Text style={styles.unsupportedDescription}>
            Your device doesn't support biometric authentication. You can still
            use the app with OTP verification.
          </Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleSkipBiometric}
            disabled={isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Continuing...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const config = getBiometricConfig();
    if (!config) return null;

    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupIcon}>{config.icon}</Text>
        <Text style={styles.setupTitle}>Setup {config.name}</Text>
        <Text style={styles.setupDescription}>{config.description}</Text>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
          <Text style={styles.benefitItem}>• Quick and secure app access</Text>
          <Text style={styles.benefitItem}>
            • No need to enter OTP every time
          </Text>
          <Text style={styles.benefitItem}>
            • Your biometric data stays on your device
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={handleSetupBiometric}
            disabled={isLoading}
          >
            <Text style={styles.setupButtonText}>
              {isLoading ? 'Setting up...' : `Enable ${config.name}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipBiometric}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    isSupported,
    getBiometricConfig,
    handleSetupBiometric,
    handleSkipBiometric,
    isLoading,
  ]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Secure Your Account</Text>
        <Text style={styles.subtitle}>
          Set up biometric authentication for quick and secure access
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Biometric Setup Content */}
      {renderBiometricContent()}

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Text style={styles.securityNoteTitle}>Security Note</Text>
        <Text style={styles.securityNoteText}>
          Your biometric data is stored securely on your device and never shared
          with FinMatter. You can change this setting anytime in the app.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
  },
  setupContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  setupIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  setupTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  setupDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  benefitsTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  benefitItem: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  buttonContainer: {
    alignSelf: 'stretch',
    gap: theme.spacing.md,
  },
  setupButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  setupButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skipButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
  unsupportedContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  unsupportedTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  unsupportedDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  securityNote: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  securityNoteTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  securityNoteText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
});

export default BiometricSetupScreen;
