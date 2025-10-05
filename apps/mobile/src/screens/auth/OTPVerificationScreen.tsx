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
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import OTPInputView from 'react-native-otp-input';
import { AuthScreenProps } from '../../navigation/types';
import { theme } from '../../constants/theme';
import { authService } from '../../services/AuthService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

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
   * 30-second countdown before resend is allowed
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
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Initializes cooldown timer when component mounts
   */
  useEffect(() => {
    startResendCooldown();

    // Cleanup on unmount
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [startResendCooldown]);

  /**
   * Handles OTP input changes
   * Auto-verifies when 6 digits are entered
   */
  const handleOTPChange = useCallback(
    (code: string) => {
      setOtp(code);
      setError(null); // Clear error when user types

      // Auto-verify when 6 digits entered
      if (code.length === 6) {
        handleVerifyOTP(code);
      }
    },
    [phoneNumber, navigation],
  );

  /**
   * Verifies the entered OTP
   * Handles success, failure, and error states
   */
  const handleVerifyOTP = useCallback(
    async (otpCode?: string) => {
      const codeToVerify = otpCode || otp;

      if (codeToVerify.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Verify OTP via API
        const response = await authService.verifyOTP(phoneNumber, codeToVerify);

        if (response.success && response.data) {
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

          // Navigate to biometric setup or main app
          if (transformedData.user.biometricEnabled) {
            // User already has biometric enabled, go to main app
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          } else {
            // Navigate to biometric setup
            navigation.navigate('BiometricSetup', {
              userId: transformedData.user.id,
              phoneNumber,
            });
          }
        } else {
          // Handle verification failure
          const newAttemptCount = attemptCount + 1;
          setAttemptCount(newAttemptCount);

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

          // Show alert after multiple failed attempts
          if (newAttemptCount >= 3) {
            Alert.alert(
              'Multiple Failed Attempts',
              'You have exceeded the maximum number of verification attempts. Please request a new OTP.',
              [
                {
                  text: 'Request New OTP',
                  onPress: handleResendOTP,
                },
                { text: 'Cancel', style: 'cancel' },
              ],
            );
          }
        }
      } catch (error) {
        console.error('Verify OTP error:', error);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [otp, phoneNumber, navigation, attemptCount],
  );

  /**
   * Handles OTP resend functionality
   * Includes rate limiting and cooldown management
   */
  const handleResendOTP = useCallback(async () => {
    if (!canResend) {
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
        showSuccessToast(
          'OTP Sent',
          'A new verification code has been sent to your phone.',
        );
        startResendCooldown(); // Start new cooldown
      } else {
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
    } catch (error) {
      console.error('Resend OTP error:', error);
      showErrorToast(
        'Network Error',
        'Please check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [canResend, phoneNumber, startResendCooldown]);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
          <Text style={styles.phoneNumber}>{getFormattedPhoneNumber()}</Text>
        </View>

        {/* OTP Input Section */}
        <View style={styles.otpSection}>
          <OTPInputView
            style={styles.otpInput}
            pinCount={6}
            code={otp}
            onCodeChanged={handleOTPChange}
            autoFocusOnLoad
            secureTextEntry
            codeInputFieldStyle={[
              styles.otpInputField,
              error && styles.otpInputFieldError,
            ]}
            codeInputHighlightStyle={styles.otpInputHighlight}
            editable={!isLoading}
          />

          {/* Error Message */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Attempt Count */}
          {attemptCount > 0 && (
            <Text style={styles.attemptText}>Attempts: {attemptCount}/3</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {/* Verify Button (for manual verification) */}
          {otp.length === 6 && !isLoading && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => handleVerifyOTP()}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          )}

          {/* Resend Button */}
          <TouchableOpacity
            style={[
              styles.resendButton,
              (!canResend || isLoading) && styles.resendButtonDisabled,
            ]}
            onPress={handleResendOTP}
            disabled={!canResend || isLoading}
          >
            <Text
              style={[
                styles.resendButtonText,
                (!canResend || isLoading) && styles.resendButtonTextDisabled,
              ]}
            >
              {getResendButtonText()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Didn't receive the code? Check your SMS messages or request a new
            code.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
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
    marginBottom: theme.spacing.xs,
  },
  phoneNumber: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
  },
  otpSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  otpInput: {
    width: '100%',
    height: 80,
  },
  otpInputField: {
    width: 45,
    height: 50,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
  },
  otpInputFieldError: {
    borderColor: theme.colors.error,
  },
  otpInputHighlight: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  attemptText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  actionSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  verifyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minWidth: 200,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  resendButton: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  resendButtonDisabled: {
    borderColor: theme.colors.disabled,
  },
  resendButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
  },
  resendButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
  infoSection: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default OTPVerificationScreen;
