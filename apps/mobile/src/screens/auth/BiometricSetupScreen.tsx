/* eslint-disable react-hooks/exhaustive-deps */
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
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { showSuccessToast } from '../../utils/toast';
import { haptics } from '../../utils/haptics';

// Define BiometryTypes enum locally to avoid type issues
enum BiometryTypes {
  TouchID = 'TouchID',
  FaceID = 'FaceID',
  Biometrics = 'Biometrics',
}
import { AuthScreenProps } from '../../navigation/types';
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
  const { userId } = route.params;

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
    } catch (err) {
      console.error('Biometric check error:', err);
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
    } catch (err) {
      console.error('Biometric setup error:', err);
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

      // Update user preference to skip biometric
      const updateResponse = await authService.updateBiometricPreference(
        userId,
        false,
      );

      if (updateResponse.success) {
        showSuccessToast(
          'Setup Complete',
          'You can enable biometric authentication later in settings.',
        );
        // Navigate to onboarding flow
        navigation.reset({
          index: 0,
          routes: [{ name: 'Onboarding' }],
        });
      } else {
        setError('Failed to save preference. Please try again.');
      }
    } catch (err) {
      console.error('Skip biometric error:', err);
      setError('Failed to save preference. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, navigation]);

  const config = getBiometricConfig();

  return (
    <ScrollView className='flex-1 bg-background flex-grow p-4'>
      {/* Header Section */}
      <View className='items-center mb-12 px-4'>
        <Text className='text-3xl font-bold text-text text-center mb-4'>
          Secure Your Account
        </Text>
        <Text className='text-base text-text-secondary text-center leading-6'>
          Add an extra layer of security with biometric authentication
        </Text>
      </View>

      {/* Biometric Icon Section */}
      <View className='items-center mb-12'>
        {isSupported && config ? (
          <View className='items-center'>
            <Text className='text-8xl mb-4'>{config.icon}</Text>
            <Text className='text-2xl font-semibold text-text text-center mb-2'>
              {config.name}
            </Text>
            <Text className='text-base text-text-secondary text-center'>
              {config.description}
            </Text>
          </View>
        ) : (
          <View className='items-center'>
            <Text className='text-6xl mb-4'>📱</Text>
            <Text className='text-xl font-semibold text-text-secondary text-center'>
              Biometric Not Available
            </Text>
            <Text className='text-base text-text-secondary text-center mt-2'>
              Your device doesn't support biometric authentication
            </Text>
          </View>
        )}
      </View>

      {/* Benefits Section */}
      <View className='mb-12 px-4'>
        <Text className='text-lg font-semibold text-text mb-4'>
          Benefits of biometric authentication:
        </Text>
        <View className='space-y-3'>
          <View className='flex-row items-start'>
            <Text className='text-success text-xl mr-3'>✓</Text>
            <Text className='text-base text-text-secondary flex-1'>
              Quick and secure access to your account
            </Text>
          </View>
          <View className='flex-row items-start'>
            <Text className='text-success text-xl mr-3'>✓</Text>
            <Text className='text-base text-text-secondary flex-1'>
              No need to remember complex passwords
            </Text>
          </View>
          <View className='flex-row items-start'>
            <Text className='text-success text-xl mr-3'>✓</Text>
            <Text className='text-base text-text-secondary flex-1'>
              Enhanced security for your financial data
            </Text>
          </View>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View className='mb-6 px-4'>
          <Text className='text-error text-sm text-center bg-error-background p-3 rounded-md'>
            {error}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className='px-4 space-y-4'>
        {isSupported ? (
          <>
            {/* Enable Biometric Button */}
            <TouchableOpacity
              className={`rounded-md py-4 px-6 items-center ${
                isLoading ? 'bg-disabled' : 'bg-primary'
              }`}
              onPress={handleSetupBiometric}
              disabled={isLoading}
            >
              <Text
                className={`text-base font-semibold ${
                  isLoading ? 'text-text-secondary' : 'text-white'
                }`}
              >
                {isLoading ? 'Setting up...' : `Enable ${config?.name}`}
              </Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              className='py-3 px-6 items-center'
              onPress={handleSkipBiometric}
              disabled={isLoading}
            >
              <Text className='text-base font-medium text-text-secondary'>
                Skip for now
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Continue Button when biometric not supported */
          <TouchableOpacity
            className={`rounded-md py-4 px-6 items-center ${
              isLoading ? 'bg-disabled' : 'bg-primary'
            }`}
            onPress={handleSkipBiometric}
            disabled={isLoading}
          >
            <Text
              className={`text-base font-semibold ${
                isLoading ? 'text-text-secondary' : 'text-white'
              }`}
            >
              {isLoading ? 'Continuing...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Security Note */}
      <View className='mt-8 px-4'>
        <Text className='text-xs text-text-tertiary text-center leading-4'>
          Your biometric data is stored securely on your device and is never
          shared with our servers. You can change this setting anytime in your
          profile.
        </Text>
      </View>
    </ScrollView>
  );
};

export default BiometricSetupScreen;
