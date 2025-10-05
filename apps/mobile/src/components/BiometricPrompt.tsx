/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Biometric Prompt Component
 * Handles biometric authentication on app launch for users with biometric enabled
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
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
      animationType='fade'
      onRequestClose={onCancel}
    >
      <View className='flex-1 bg-black/80 justify-center items-center'>
        <View
          className='bg-background rounded-2xl p-8 items-center shadow-lg max-w-sm'
          style={{ width: screenWidth * 0.8 }}
        >
          <Text className='text-5xl mb-6'>🔐</Text>
          <Text className='text-2xl font-bold text-text text-center mb-2'>
            Unlock FinMatter
          </Text>
          <Text className='text-base text-text-secondary text-center mb-8'>
            Use your biometric to continue securely
          </Text>

          {isLoading && (
            <Text className='text-base text-primary text-center mb-6 italic'>
              Authenticating...
            </Text>
          )}

          <View className='w-full gap-4'>
            <TouchableOpacity
              className='bg-primary rounded-md py-4 px-6 items-center'
              onPress={onFallback}
              disabled={isLoading}
            >
              <Text className='text-white text-base font-semibold'>
                Use Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className='py-3 px-6 items-center'
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text className='text-text-secondary text-base font-medium'>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BiometricPrompt;
