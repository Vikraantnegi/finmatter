/**
 * Notification Permission Screen
 * Requests permission for push notifications
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
// Permission handling will be implemented later
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { haptics } from '../../utils/haptics';

interface NotificationPermissionScreenProps {
  navigation: any;
  route: any;
}

export const NotificationPermissionScreen: React.FC<
  NotificationPermissionScreenProps
> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAllowNotifications = async () => {
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
          'Notifications Enabled',
          "You'll now receive important updates about your finances.",
        );

        // Update user preference
        // await authService.setNotificationPermission(true);

        // Navigate to next screen after a short delay
        setTimeout(() => {
          navigation.navigate('SMSPermission');
        }, 1500);
      } else {
        haptics.error();
        showErrorToast(
          'Permission Denied',
          'You can enable notifications later in settings.',
        );
        // Still continue to next screen
        navigation.navigate('SMSPermission');
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      showErrorToast(
        'Error',
        'Failed to request notification permission. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Notifications',
      "You can enable notifications later in settings. You'll miss important updates about your finances.",
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            showErrorToast(
              'Notifications Disabled',
              'You can enable them later in settings.',
            );
            navigation.navigate('SMSPermission');
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
          Stay Informed 📱
        </Text>
        <Text className='text-lg text-text-secondary text-center leading-6'>
          Get notified about important updates to your finances
        </Text>
      </View>

      {/* Illustration Section */}
      <View className='items-center mb-12'>
        <View className='w-32 h-32 bg-info/10 rounded-full items-center justify-center mb-6'>
          <Text className='text-6xl'>🔔</Text>
        </View>
        <Text className='text-base text-text-secondary text-center'>
          We'll send you helpful reminders and updates
        </Text>
      </View>

      {/* Benefits Section */}
      <View className='mb-12 px-4'>
        <Text className='text-lg font-semibold text-text mb-4'>
          What you'll receive:
        </Text>
        <View className='space-y-4'>
          <View className='flex-row items-start'>
            <Text className='text-info text-xl mr-3'>🔔</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Bill Payment Reminders
              </Text>
              <Text className='text-sm text-text-secondary'>
                Never miss a payment deadline
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <Text className='text-info text-xl mr-3'>💰</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Spending Alerts
              </Text>
              <Text className='text-sm text-text-secondary'>
                Know when you're approaching budget limits
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <Text className='text-info text-xl mr-3'>📊</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Financial Insights
              </Text>
              <Text className='text-sm text-text-secondary'>
                Weekly reports on your financial health
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <Text className='text-info text-xl mr-3'>🔒</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Security Alerts
              </Text>
              <Text className='text-sm text-text-secondary'>
                Immediate notifications for account activity
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Privacy Section */}
      <View className='mb-12 px-4'>
        <View className='bg-surface rounded-md p-4 border border-border'>
          <Text className='text-base font-medium text-text mb-2'>
            🔒 Your Privacy Matters
          </Text>
          <Text className='text-sm text-text-secondary leading-5'>
            We only send essential notifications. You can customize or disable
            them anytime in settings. We never share your data with third
            parties.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className='px-4 space-y-4'>
        <TouchableOpacity
          className={`rounded-md py-4 px-6 items-center ${
            isLoading ? 'bg-disabled' : 'bg-primary'
          }`}
          onPress={handleAllowNotifications}
          disabled={isLoading}
        >
          <Text
            className={`text-base font-semibold ${
              isLoading ? 'text-text-secondary' : 'text-white'
            }`}
          >
            {isLoading ? 'Requesting...' : 'Allow Notifications'}
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

export default NotificationPermissionScreen;
