/**
 * Phone Input Screen for FinMatter Authentication
 *
 * Features:
 * - Country code selection with modal
 * - Phone number input with validation
 * - Format: +91 XXXXX XXXXX
 * - 10-digit Indian number validation
 * - Rate limiting feedback
 * - Loading states during OTP send
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import CountryPicker, {
  Country,
  CountryCode,
  DARK_THEME,
  DEFAULT_THEME,
} from 'react-native-country-picker-modal';
import { AuthScreenProps } from '../../navigation/types';
import { theme } from '../../constants/theme';
import { authService } from '../../services/AuthService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { haptics } from '../../utils/haptics';

interface PhoneInputScreenProps extends AuthScreenProps<'PhoneInput'> {}

/**
 * Default country configuration for India
 */
const DEFAULT_COUNTRY: Country = {
  cca2: 'IN' as CountryCode,
  currency: ['INR'],
  callingCode: ['91'],
  region: 'Asia',
  subregion: 'Southern Asia',
  flag: '🇮🇳',
  name: 'India',
};

/**
 * Phone Input Screen Component
 *
 * Handles phone number input with country code selection
 * and validation before sending OTP
 */
export const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({
  navigation,
}) => {
  // State management
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    general?: string;
  }>({});

  /**
   * Validates phone number format
   * For India: 10 digits required
   * For other countries: basic format validation
   */
  const validatePhoneNumber = useCallback(
    (number: string): boolean => {
      const cleanedNumber = number.replace(/\D/g, '');

      if (countryCode === 'IN') {
        // Indian numbers must be exactly 10 digits
        return /^\d{10}$/.test(cleanedNumber);
      }

      // For other countries, basic validation (7-15 digits)
      return /^\d{7,15}$/.test(cleanedNumber);
    },
    [countryCode],
  );

  /**
   * Formats phone number for display
   * Indian format: XXXXX XXXXX
   * Other countries: basic formatting
   */
  const formatPhoneNumber = useCallback(
    (number: string): string => {
      const cleanedNumber = number.replace(/\D/g, '');

      if (countryCode === 'IN') {
        // Indian format: XXXXX XXXXX
        if (cleanedNumber.length <= 5) {
          return cleanedNumber;
        }
        return `${cleanedNumber.slice(0, 5)} ${cleanedNumber.slice(5, 10)}`;
      }

      // For other countries, just clean the number
      return cleanedNumber;
    },
    [countryCode],
  );

  /**
   * Handles phone number input changes
   * Formats the number and validates it
   */
  const handlePhoneNumberChange = useCallback(
    (text: string) => {
      const formatted = formatPhoneNumber(text);
      setPhoneNumber(formatted);

      // Clear errors when user starts typing
      if (errors.phoneNumber) {
        setErrors(prev => ({ ...prev, phoneNumber: undefined }));
      }
    },
    [formatPhoneNumber, errors.phoneNumber],
  );

  /**
   * Handles country selection from picker
   */
  const handleCountrySelect = useCallback((country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setPhoneNumber(''); // Clear phone number when country changes
    setErrors({}); // Clear all errors
  }, []);

  /**
   * Validates input and sends OTP
   */
  const handleSendOTP = useCallback(async () => {
    try {
      // Clear previous errors
      setErrors({});

      // Validate phone number
      const cleanedNumber = phoneNumber.replace(/\D/g, '');
      if (!cleanedNumber) {
        setErrors({ phoneNumber: 'Phone number is required' });
        return;
      }

      if (!validatePhoneNumber(phoneNumber)) {
        const message =
          countryCode === 'IN'
            ? 'Please enter a valid 10-digit Indian phone number'
            : 'Please enter a valid phone number';
        setErrors({ phoneNumber: message });
        return;
      }

      // Set loading state
      setIsLoading(true);

      // Format phone number with country code
      const fullPhoneNumber = `+${callingCode}${cleanedNumber}`;

      // Send OTP via API
      const response = await authService.sendOTP(fullPhoneNumber);

      if (response.success) {
        haptics.success();
        // Navigate to OTP verification screen
        navigation.navigate('OTPVerification', {
          phoneNumber: fullPhoneNumber,
          callingCode,
          countryCode,
        });
      } else {
        haptics.error();
        // Handle API errors
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
            'Too Many Requests',
            'You have exceeded the maximum number of OTP requests. Please wait before trying again.',
          );
        } else {
          setErrors({
            general: errorMessage,
          });
        }
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      showErrorToast(
        'Network Error',
        'Please check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, countryCode, callingCode, validatePhoneNumber, navigation]);

  /**
   * Gets the current country flag and calling code display
   */
  const getCountryDisplay = useCallback(() => {
    return `${DEFAULT_COUNTRY.flag} +${callingCode}`;
  }, [callingCode]);

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
          <Text style={styles.title}>Enter Your Phone Number</Text>
          <Text style={styles.subtitle}>
            We'll send you a verification code via SMS
          </Text>
        </View>

        {/* Phone Input Section */}
        <View style={styles.inputSection}>
          {/* Country Code Picker */}
          <TouchableOpacity
            style={styles.countryPicker}
            onPress={() => setShowCountryPicker(true)}
          >
            <Text style={styles.countryText}>{getCountryDisplay()}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>

          {/* Phone Number Input */}
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={[
                styles.phoneInput,
                errors.phoneNumber && styles.phoneInputError,
              ]}
              placeholder={
                countryCode === 'IN' ? 'XXXXX XXXXX' : 'Phone number'
              }
              placeholderTextColor={theme.colors.textSecondary}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              maxLength={countryCode === 'IN' ? 11 : 15} // Account for space in Indian format
              autoFocus
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Error Messages */}
        {errors.phoneNumber && (
          <Text style={styles.errorText}>{errors.phoneNumber}</Text>
        )}
        {errors.general && (
          <Text style={styles.errorText}>{errors.general}</Text>
        )}

        {/* Send OTP Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!phoneNumber.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendOTP}
          disabled={!phoneNumber.trim() || isLoading}
        >
          <Text
            style={[
              styles.sendButtonText,
              (!phoneNumber.trim() || isLoading) &&
                styles.sendButtonTextDisabled,
            ]}
          >
            {isLoading ? 'Sending...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            By continuing, you agree to receive SMS messages for verification.
            Standard messaging rates may apply.
          </Text>
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      <CountryPicker
        visible={showCountryPicker}
        onSelect={handleCountrySelect}
        onClose={() => setShowCountryPicker(false)}
        withFilter
        withFlag
        withCallingCode
        withEmoji
        theme={DEFAULT_THEME}
        preferredCountries={['IN', 'US', 'GB']} // Preferred countries for quick selection
        countryCode={countryCode}
      />
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
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 100,
  },
  countryText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginRight: theme.spacing.xs,
  },
  dropdownIcon: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  phoneInputContainer: {
    flex: 1,
  },
  phoneInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  phoneInputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  sendButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  sendButtonTextDisabled: {
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

export default PhoneInputScreen;
