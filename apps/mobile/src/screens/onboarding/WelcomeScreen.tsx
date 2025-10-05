/**
 * Welcome/Name Input Screen
 * First screen after biometric setup - collects user's name
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { authService } from '../../services/AuthService';

interface WelcomeScreenProps {
  navigation: any;
  route: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateName = (inputName: string): boolean => {
    const trimmedName = inputName.trim();
    return trimmedName.length >= 2 && /^[a-zA-Z\s]+$/.test(trimmedName);
  };

  const handleContinue = async () => {
    if (!validateName(name)) {
      showErrorToast(
        'Invalid Name',
        'Please enter a valid name (at least 2 characters, letters only).',
      );
      return;
    }

    setIsLoading(true);

    try {
      // Update user profile via API
      const response = await authService.updateUserProfile({
        name: name.trim(),
      });

      if (response.success) {
        showSuccessToast('Welcome!', `Nice to meet you, ${name.trim()}!`);

        // Navigate to next screen after a short delay
        setTimeout(() => {
          navigation.navigate('NotificationPermission');
        }, 1500);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showErrorToast('Error', 'Failed to save your name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <View className='items-center mb-12 px-4'>
          <Text className='text-4xl font-bold text-text text-center mb-4'>
            Welcome to FinMatter! 👋
          </Text>
          <Text className='text-lg text-text-secondary text-center leading-6'>
            Let's get to know you better. What should we call you?
          </Text>
        </View>

        {/* Illustration Section */}
        <View className='items-center mb-12'>
          <View className='w-32 h-32 bg-primary/10 rounded-full items-center justify-center mb-6'>
            <Text className='text-6xl'>👤</Text>
          </View>
          <Text className='text-base text-text-secondary text-center'>
            Your name helps us personalize your experience
          </Text>
        </View>

        {/* Name Input Section */}
        <View className='mb-8'>
          <Text className='text-lg font-semibold text-text mb-3'>
            What's your name?
          </Text>
          <TextInput
            className='bg-surface rounded-md px-4 py-4 text-base text-text border border-border'
            placeholder='Enter your name'
            placeholderTextColor='#94A3B8'
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize='words'
            autoCorrect={false}
            maxLength={50}
            editable={!isLoading}
          />
          <Text className='text-sm text-text-tertiary mt-2'>
            {name.length}/50 characters
          </Text>
        </View>

        {/* Benefits Section */}
        <View className='mb-12 px-4'>
          <Text className='text-lg font-semibold text-text mb-4'>
            Why we need this:
          </Text>
          <View className='space-y-3'>
            <View className='flex-row items-start'>
              <Text className='text-success text-xl mr-3'>✓</Text>
              <Text className='text-base text-text-secondary flex-1'>
                Personalize your dashboard and recommendations
              </Text>
            </View>
            <View className='flex-row items-start'>
              <Text className='text-success text-xl mr-3'>✓</Text>
              <Text className='text-base text-text-secondary flex-1'>
                Create a more engaging financial experience
              </Text>
            </View>
            <View className='flex-row items-start'>
              <Text className='text-success text-xl mr-3'>✓</Text>
              <Text className='text-base text-text-secondary flex-1'>
                Help you track your financial goals better
              </Text>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <View className='px-4'>
          <TouchableOpacity
            className={`rounded-md py-4 px-6 items-center ${
              !validateName(name) || isLoading ? 'bg-disabled' : 'bg-primary'
            }`}
            onPress={handleContinue}
            disabled={!validateName(name) || isLoading}
          >
            <LinearGradient
              colors={
                validateName(name) && !isLoading
                  ? ['#3B82F6', '#2563EB']
                  : ['#CBD5E1', '#CBD5E1']
              }
              className='rounded-md py-4 px-8 w-full items-center'
            >
              <Text
                className={`text-base font-semibold ${
                  !validateName(name) || isLoading
                    ? 'text-text-secondary'
                    : 'text-white'
                }`}
              >
                {isLoading ? 'Saving...' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <View className='mt-8 px-4'>
          <Text className='text-xs text-text-tertiary text-center leading-4'>
            Your information is secure and will only be used to personalize your
            FinMatter experience.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default WelcomeScreen;
