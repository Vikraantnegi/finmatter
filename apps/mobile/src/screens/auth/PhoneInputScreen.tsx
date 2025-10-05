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
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import CountryPicker, {
  Country,
  CountryCode,
  DEFAULT_THEME,
} from 'react-native-country-picker-modal';
import { AuthScreenProps } from '../../navigation/types';
import { authService } from '../../services/AuthService';
import { showErrorToast } from '../../utils/toast';
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
 * Validates phone numbers and sends OTP via API
 */
export const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({
  navigation,
}) => {
  // State management
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>(
    DEFAULT_COUNTRY.cca2,
  );
  const [callingCode, setCallingCode] = useState(
    DEFAULT_COUNTRY.callingCode[0],
  );
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    phoneNumber?: string;
    general?: string;
  }>({});

  /**
   * Validates phone number format based on country
   */
  const validatePhoneNumber = useCallback(
    (phone: string): boolean => {
      if (!phone.trim()) {
        setErrors({ phoneNumber: 'Phone number is required' });
        return false;
      }

      // Remove spaces and special characters
      const cleanedPhone = phone.replace(/[\s\-()]/g, '');

      if (countryCode === 'IN') {
        // Indian phone number validation (10 digits)
        if (!/^\d{10}$/.test(cleanedPhone)) {
          setErrors({
            phoneNumber: 'Please enter a valid 10-digit phone number',
          });
          return false;
        }
      } else {
        // General validation for other countries (6-15 digits)
        if (!/^\d{6,15}$/.test(cleanedPhone)) {
          setErrors({
            phoneNumber: 'Please enter a valid phone number',
          });
          return false;
        }
      }

      setErrors({});
      return true;
    },
    [countryCode],
  );

  /**
   * Handles phone number input changes
   */
  const handlePhoneNumberChange = useCallback(
    (text: string) => {
      // Format phone number for display (Indian format with space)
      let formattedText = text;

      if (countryCode === 'IN' && text.length > 0) {
        // Add space after 5 digits for Indian format
        const cleanedText = text.replace(/\s/g, '');
        if (cleanedText.length > 5) {
          formattedText = `${cleanedText.slice(0, 5)} ${cleanedText.slice(5, 10)}`;
        } else {
          formattedText = cleanedText;
        }
      }

      setPhoneNumber(formattedText);

      // Clear errors when user starts typing
      if (errors.phoneNumber) {
        setErrors({});
      }
    },
    [countryCode, errors.phoneNumber],
  );

  /**
   * Handles sending OTP
   */
  const handleSendOTP = useCallback(async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      // Clean phone number for API call
      const cleanedNumber = phoneNumber.replace(/\s/g, '');
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
      className='flex-1 bg-background'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className='flex-1 flex-grow p-4'
        keyboardShouldPersistTaps='handled'
      >
        {/* Header Section */}
        <View className='items-center mb-8 px-4'>
          <Text className='text-3xl font-bold text-text text-center mb-2'>
            Enter Your Phone Number
          </Text>
          <Text className='text-base text-text-secondary text-center'>
            We'll send you a verification code via SMS
          </Text>
        </View>

        {/* Phone Input Section */}
        <View className='flex-row items-center mb-6 gap-2'>
          {/* Country Code Picker */}
          <TouchableOpacity
            className='flex-row items-center bg-surface rounded-md px-4 py-4 border border-border min-w-[100px]'
            onPress={() => setShowCountryPicker(true)}
          >
            <Text className='text-base text-text mr-1'>
              {getCountryDisplay()}
            </Text>
            <Text className='text-sm text-text-secondary'>▼</Text>
          </TouchableOpacity>

          {/* Phone Number Input */}
          <View className='flex-1'>
            <TextInput
              className={`bg-surface rounded-md px-4 py-4 text-base text-text border ${
                errors.phoneNumber ? 'border-error' : 'border-border'
              }`}
              placeholder={
                countryCode === 'IN' ? 'XXXXX XXXXX' : 'Phone number'
              }
              placeholderTextColor='#94A3B8'
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType='phone-pad'
              maxLength={countryCode === 'IN' ? 11 : 15} // Account for space in Indian format
              autoFocus
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Error Messages */}
        {errors.phoneNumber && (
          <Text className='text-error text-sm text-center mb-4'>
            {errors.phoneNumber}
          </Text>
        )}
        {errors.general && (
          <Text className='text-error text-sm text-center mb-4'>
            {errors.general}
          </Text>
        )}

        {/* Send OTP Button */}
        <TouchableOpacity
          className={`rounded-md py-4 items-center mb-6 ${
            !phoneNumber.trim() || isLoading ? 'bg-disabled' : 'bg-primary'
          }`}
          onPress={handleSendOTP}
          disabled={!phoneNumber.trim() || isLoading}
        >
          <Text
            className={`text-base font-semibold ${
              !phoneNumber.trim() || isLoading
                ? 'text-text-secondary'
                : 'text-white'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>

        {/* Info Section */}
        <View className='items-center'>
          <Text className='text-sm text-text-secondary text-center leading-[18px]'>
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Message and data rates may apply.
          </Text>
        </View>
      </ScrollView>

      {/* Country Picker Modal */}
      <CountryPicker
        withEmoji
        withCallingCode
        withFilter
        withFlag
        withCountryNameButton
        withAlphaFilter
        withCallingCodeButton
        withModal
        visible={showCountryPicker}
        onSelect={country => {
          setCountryCode(country.cca2);
          setCallingCode(country.callingCode[0]);
          setShowCountryPicker(false);
        }}
        onClose={() => setShowCountryPicker(false)}
        theme={DEFAULT_THEME}
        countryCode={DEFAULT_COUNTRY.cca2}
        // eslint-disable-next-line react-native/no-inline-styles
        containerButtonStyle={{
          backgroundColor: '#F8FAFC',
          borderRadius: 8,
        }}
      />
    </KeyboardAvoidingView>
  );
};

export default PhoneInputScreen;
