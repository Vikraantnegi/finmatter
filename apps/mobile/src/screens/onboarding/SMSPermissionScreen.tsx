/**
 * SMS Permission Screen (Android Only)
 * Requests SMS permission for reading bank SMS and transaction alerts
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
// Permission handling will be implemented later
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { haptics } from '../../utils/haptics';

interface SMSPermissionScreenProps {
  navigation: any;
  route: any;
}

export const SMSPermissionScreen: React.FC<SMSPermissionScreenProps> = ({
  navigation,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Skip SMS permission on iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Navigate directly to tutorial on iOS
      setTimeout(() => {
        navigation.navigate('Tutorial');
      }, 100);
    }
  }, [navigation]);

  if (Platform.OS === 'ios') {
    return (
      <View className='flex-1 bg-background justify-center items-center'>
        <Text className='text-lg text-text-secondary'>Redirecting...</Text>
      </View>
    );
  }

  const handleAllowSMS = async () => {
    setIsLoading(true);

    try {
      // For demo purposes, we'll simulate the permission flow
      // In a real app, you would use the actual permission APIs

      // Simulate permission request delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For now, always grant permission (simulated)
      const granted = true;

      if (granted) {
        haptics.success();
        showSuccessToast(
          'SMS Access Granted',
          'We can now automatically categorize your transactions.',
        );

        // Update user preference
        // await authService.setSMSPermission(true);

        // Navigate to next screen after a short delay
        setTimeout(() => {
          navigation.navigate('Tutorial');
        }, 1500);
      } else {
        haptics.error();
        showErrorToast(
          'Permission Denied',
          'You can enable SMS access later in settings.',
        );
        // Still continue to next screen
        navigation.navigate('Tutorial');
      }
    } catch (error) {
      console.error('SMS permission error:', error);
      showErrorToast(
        'Error',
        'Failed to request SMS permission. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip SMS Access',
      "Without SMS access, you'll need to manually add transactions. You can enable this later in settings.",
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            showErrorToast(
              'SMS Access Disabled',
              'You can enable it later in settings.',
            );
            navigation.navigate('Tutorial');
          },
        },
      ],
    );
  };

  return (
    <ScrollView className='flex-1 bg-background flex-grow p-4'>
      {/* Header Section */}
      <View className='items-center mb-12 px-4'>
        <Text className='text-4xl font-bold text-text text-center mb-4'>
          Smart Transaction Tracking 📨
        </Text>
        <Text className='text-lg text-text-secondary text-center leading-6'>
          Automatically categorize transactions from your bank SMS
        </Text>
      </View>

      {/* Illustration Section */}
      <View className='items-center mb-12'>
        <View className='w-32 h-32 bg-secondary/10 rounded-full items-center justify-center mb-6'>
          <Text className='text-6xl'>📱</Text>
        </View>
        <Text className='text-base text-text-secondary text-center'>
          We'll read your bank SMS to track transactions automatically
        </Text>
      </View>

      {/* Features Section */}
      <View className='mb-12 px-4'>
        <Text className='text-lg font-semibold text-text mb-4'>
          What this enables:
        </Text>
        <View className='space-y-4'>
          <View className='flex-row items-start'>
            <Text className='text-secondary text-xl mr-3'>🤖</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Automatic Transaction Import
              </Text>
              <Text className='text-sm text-text-secondary'>
                No more manual entry of every transaction
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <Text className='text-secondary text-xl mr-3'>🏷️</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Smart Categorization
              </Text>
              <Text className='text-sm text-text-secondary'>
                Automatically categorize expenses and income
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <Text className='text-secondary text-xl mr-3'>📊</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Real-time Updates
              </Text>
              <Text className='text-sm text-text-secondary'>
                Your balance updates instantly with new transactions
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <Text className='text-secondary text-xl mr-3'>💡</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Spending Insights
              </Text>
              <Text className='text-sm text-text-secondary'>
                Better insights with complete transaction history
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Security Section */}
      <View className='mb-12 px-4'>
        <View className='bg-surface rounded-md p-4 border border-border'>
          <Text className='text-base font-medium text-text mb-2'>
            🔒 Privacy & Security
          </Text>
          <Text className='text-sm text-text-secondary leading-5'>
            SMS data is processed locally on your device. We only extract
            transaction information and never store your messages. All data is
            encrypted and secure.
          </Text>
        </View>
      </View>

      {/* How It Works */}
      <View className='mb-12 px-4'>
        <Text className='text-lg font-semibold text-text mb-4'>
          How it works:
        </Text>
        <View className='space-y-3'>
          <View className='flex-row items-start'>
            <View className='w-6 h-6 bg-primary rounded-full items-center justify-center mr-3 mt-0.5'>
              <Text className='text-white text-xs font-bold'>1</Text>
            </View>
            <Text className='text-base text-text-secondary flex-1 leading-5'>
              We read incoming SMS from your bank
            </Text>
          </View>

          <View className='flex-row items-start'>
            <View className='w-6 h-6 bg-primary rounded-full items-center justify-center mr-3 mt-0.5'>
              <Text className='text-white text-xs font-bold'>2</Text>
            </View>
            <Text className='text-base text-text-secondary flex-1 leading-5'>
              Extract transaction details (amount, date, merchant)
            </Text>
          </View>

          <View className='flex-row items-start'>
            <View className='w-6 h-6 bg-primary rounded-full items-center justify-center mr-3 mt-0.5'>
              <Text className='text-white text-xs font-bold'>3</Text>
            </View>
            <Text className='text-base text-text-secondary flex-1 leading-5'>
              Automatically categorize and add to your account
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className='px-4 space-y-4'>
        <TouchableOpacity
          className={`rounded-md py-4 px-6 items-center ${
            isLoading ? 'bg-disabled' : 'bg-primary'
          }`}
          onPress={handleAllowSMS}
          disabled={isLoading}
        >
          <Text
            className={`text-base font-semibold ${
              isLoading ? 'text-text-secondary' : 'text-white'
            }`}
          >
            {isLoading ? 'Requesting...' : 'Allow SMS Access'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='py-3 px-6 items-center'
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text className='text-base font-medium text-text-secondary'>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SMSPermissionScreen;
