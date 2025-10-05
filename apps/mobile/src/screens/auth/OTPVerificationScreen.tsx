/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/**
 * OTP Verification Screen for FinMatter Authentication
 *
 * Features:
 * - 6-digit OTP input with auto-focus
 * - Auto-verify when 6 digits entered
 * - Resend OTP option with 30-second cooldown
 * - Error handling for invalid/expired OTP
 * - Loading states during verification
 * - Countdown timer for resend
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import OTPInputView from 'react-native-otp-input';
import { AuthScreenProps } from '../../navigation/types';
import { authService } from '../../services/AuthService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { haptics } from '../../utils/haptics';
import AnimatedCheckmark from '../../components/AnimatedCheckmark';
import ShakeAnimation from '../../components/ShakeAnimation';
import LoadingSpinner from '../../components/LoadingSpinner';

interface OTPVerificationScreenProps
  extends AuthScreenProps<'OTPVerification'> {}

/**
 * OTP Verification Screen Component
 *
 * Handles OTP input, verification, and resend functionality
 * with proper error handling and user feedback
 */
export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { phoneNumber, callingCode, countryCode } = route.params;

  // State management
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  // Refs
  const cooldownIntervalRef = useRef<number | null>(null);

  /**
   * Formats phone number for display
   * Shows country flag and formatted number
   */
  const getFormattedPhoneNumber = useCallback(() => {
    const countryFlag = countryCode === 'IN' ? '🇮🇳' : '📱';
    const displayNumber = phoneNumber.replace(`+${callingCode}`, '');
    return `${countryFlag} +${callingCode} ${displayNumber}`;
  }, [phoneNumber, callingCode, countryCode]);

  /**
   * Starts the resend cooldown timer
   */
  const startResendCooldown = useCallback(() => {
    setResendCooldown(30);
    setCanResend(false);

    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          setCanResend(true);
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  }, []);

  /**
   * Handles OTP input changes
   */
  const handleOTPChange = useCallback((code: string) => {
    setOtp(code);
    setError(null);

    // Auto-verify when 6 digits are entered
    if (code.length === 6) {
      handleVerifyOTP(code);
    }
  }, []);

  /**
   * Handles OTP verification
   */
  const handleVerifyOTP = useCallback(
    async (otpCode?: string) => {
      const codeToVerify = otpCode || otp;
      if (codeToVerify.length !== 6) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Verify OTP via API
        const response = await authService.verifyOTP(phoneNumber, codeToVerify);

        if (response.success && response.data) {
          // Show success animation and haptic feedback
          setShowSuccessAnimation(true);
          haptics.success();

          // Transform the response data to match expected format
          const transformedData = {
            user: {
              ...response.data.user,
              updatedAt: new Date().toISOString(),
            },
            session: {
              ...response.data.session,
              id: response.data.user.id,
              userId: response.data.user.id,
              createdAt: new Date().toISOString(),
              lastUsedAt: new Date().toISOString(),
            },
          };

          // Store user session
          await authService.storeUserSession(transformedData);

          // Navigate after animation completes
          setTimeout(() => {
            if (transformedData.user.biometricEnabled) {
              // User already has biometric enabled, go to onboarding
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            } else {
              // Navigate to biometric setup
              navigation.navigate('BiometricSetup', {
                userId: transformedData.user.id,
                phoneNumber,
              });
            }
          }, 1500);
        } else {
          // Handle verification failure with shake animation and haptic feedback
          const newAttemptCount = attemptCount + 1;
          setAttemptCount(newAttemptCount);

          setShouldShake(true);
          haptics.error();

          // Handle specific error cases
          const errorMessage =
            typeof response.error === 'string'
              ? response.error
              : (response.error as any)?.message ||
                'Verification failed. Please try again.';
          if (
            errorMessage.includes('expired') ||
            errorMessage.includes('timeout')
          ) {
            setError('OTP has expired. Please request a new one.');
          } else if (
            errorMessage.includes('invalid') ||
            errorMessage.includes('incorrect')
          ) {
            setError('Invalid OTP. Please check and try again.');
          } else {
            setError(errorMessage);
          }

          // Clear OTP input on error
          setOtp('');

          // Show alert after multiple failed attempts
          if (newAttemptCount >= 3) {
            Alert.alert(
              'Multiple Failed Attempts',
              'You have exceeded the maximum number of verification attempts. Please request a new OTP.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Reset attempt count and clear OTP
                    setAttemptCount(0);
                    setOtp('');
                  },
                },
              ],
            );
          }
        }
      } catch (err) {
        console.error('OTP verification error:', err);
        setError('Network error. Please check your connection and try again.');
        setOtp(''); // Clear OTP on error
      } finally {
        setIsLoading(false);
      }
    },
    [otp, phoneNumber, attemptCount, navigation],
  );

  /**
   * Handles resending OTP
   */
  const handleResendOTP = useCallback(async () => {
    if (!canResend || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setOtp(''); // Clear current OTP
      setAttemptCount(0); // Reset attempt count

      // Send new OTP
      const response = await authService.sendOTP(phoneNumber);

      if (response.success) {
        haptics.success();
        showSuccessToast(
          'OTP Sent',
          'A new verification code has been sent to your phone.',
        );
        startResendCooldown(); // Start new cooldown
      } else {
        haptics.error();
        const errorMessage =
          typeof response.error === 'string'
            ? response.error
            : (response.error as any)?.message ||
              'Failed to send OTP. Please try again.';
        if (
          errorMessage.includes('rate limit') ||
          errorMessage.includes('too many')
        ) {
          showErrorToast(
            'Rate Limit Exceeded',
            'You have exceeded the maximum number of OTP requests. Please wait before trying again.',
          );
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      showErrorToast(
        'Network Error',
        'Please check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [canResend, phoneNumber, startResendCooldown, isLoading]);

  /**
   * Handles back navigation
   * Confirms with user before going back
   */
  const handleGoBack = useCallback(() => {
    Alert.alert(
      'Cancel Verification',
      'Are you sure you want to go back? You will need to enter your phone number again.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Go Back',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }, [navigation]);

  /**
   * Gets the resend button text based on cooldown state
   */
  const getResendButtonText = useCallback(() => {
    if (isLoading) {
      return 'Sending...';
    }
    if (canResend) {
      return 'Resend OTP';
    }
    return `Resend in ${resendCooldown}s`;
  }, [canResend, resendCooldown, isLoading]);

  // Initialize cooldown on component mount
  useEffect(() => {
    startResendCooldown();
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [startResendCooldown]);

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-background'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className='flex-1 flex-grow p-4'
        keyboardShouldPersistTaps='handled'
      >
        {/* Header Section */}
        <View className='items-center mb-8 px-4'>
          <TouchableOpacity
            className='self-start mb-4 p-2'
            onPress={handleGoBack}
          >
            <Text className='text-2xl text-primary'>←</Text>
          </TouchableOpacity>

          <Text className='text-3xl font-bold text-text text-center mb-2'>
            Verify Your Phone
          </Text>
          <Text className='text-base text-text-secondary text-center mb-1'>
            Enter the 6-digit code sent to
          </Text>
          <Text className='text-base font-medium text-text text-center'>
            {getFormattedPhoneNumber()}
          </Text>
        </View>

        {/* OTP Input Section */}
        <ShakeAnimation
          shouldShake={shouldShake}
          onShakeComplete={() => setShouldShake(false)}
        >
          <View className='items-center mb-8'>
            <OTPInputView
              style={{ width: '80%', height: 48 }}
              pinCount={6}
              code={otp}
              onCodeChanged={handleOTPChange}
              autoFocusOnLoad
              secureTextEntry
              codeInputFieldStyle={{
                width: 45,
                height: 50,
                borderWidth: 1,
                borderColor: error ? '#EF4444' : '#E2E8F0',
                borderRadius: 8,
                backgroundColor: '#F8FAFC',
              }}
              codeInputHighlightStyle={{
                borderColor: '#3B82F6',
                borderWidth: 2,
              }}
              editable={!isLoading}
            />

            {/* Error Message */}
            {error && (
              <Text className='text-error text-sm text-center mt-4 mb-2'>
                {error}
              </Text>
            )}

            {/* Attempt Count */}
            {attemptCount > 0 && (
              <Text className='text-text-secondary text-sm text-center mb-4'>
                Attempts: {attemptCount}/3
              </Text>
            )}
          </View>
        </ShakeAnimation>

        {/* Action Buttons */}
        <View className='items-center mb-8 gap-4'>
          {/* Verify Button (for manual verification) */}
          {otp.length === 6 && !isLoading && (
            <TouchableOpacity
              className='bg-primary rounded-md px-8 py-4 min-w-[200px] items-center'
              onPress={() => handleVerifyOTP()}
            >
              <Text className='text-white text-base font-semibold'>
                Verify OTP
              </Text>
            </TouchableOpacity>
          )}

          {/* Resend Button */}
          <TouchableOpacity
            className={`rounded-md px-6 py-4 border ${
              canResend && !isLoading ? 'border-primary' : 'border-disabled'
            }`}
            onPress={handleResendOTP}
            disabled={!canResend || isLoading}
          >
            <Text
              className={`text-base font-medium ${
                canResend && !isLoading ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              {getResendButtonText()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View className='items-center'>
          <Text className='text-sm text-text-secondary text-center leading-[18px]'>
            Didn't receive the code? Check your SMS messages or request a new
            code.
          </Text>
        </View>
      </ScrollView>

      {/* Success Animation Overlay */}
      <AnimatedCheckmark isVisible={showSuccessAnimation} />

      {/* Loading Spinner Overlay */}
      <LoadingSpinner
        isLoading={isLoading}
        message='Verifying OTP...'
        overlay={true}
      />
    </KeyboardAvoidingView>
  );
};

export default OTPVerificationScreen;
