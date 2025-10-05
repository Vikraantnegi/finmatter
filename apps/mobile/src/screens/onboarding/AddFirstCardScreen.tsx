/**
 * Add First Card Screen
 * Final onboarding step - prompts user to add their first credit card
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { showSuccessToast } from '../../utils/toast';
import { haptics } from '../../utils/haptics';

interface AddFirstCardScreenProps {
  navigation: any;
  route: any;
}

export const AddFirstCardScreen: React.FC<AddFirstCardScreenProps> = ({
  navigation,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCard = () => {
    haptics.success();
    showSuccessToast(
      'Ready to Add Cards!',
      'You can add your credit cards now or later from the main menu.',
    );

    // TODO: Navigate to add card screen when implemented
    // For now, complete onboarding
    handleCompleteOnboarding();
  };

  const handleCompleteOnboarding = async () => {
    setIsLoading(true);

    try {
      // Mark onboarding as completed
      // await authService.completeOnboarding();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Complete onboarding error:', error);
      // Still navigate to main app even if API fails
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    handleCompleteOnboarding();
  };

  return (
    <ScrollView className='flex-1 bg-background flex-grow p-4'>
      {/* Header Section */}
      <View className='items-center mb-12 px-4'>
        <Text className='text-4xl font-bold text-text text-center mb-4'>
          You're All Set! 🎉
        </Text>
        <Text className='text-lg text-text-secondary text-center leading-6'>
          Now let's add your first credit card to start tracking your finances
        </Text>
      </View>

      {/* Illustration Section */}
      <View className='items-center mb-12'>
        <View className='w-40 h-40 bg-success/10 rounded-full items-center justify-center mb-6'>
          <Text className='text-8xl'>💳</Text>
        </View>
        <Text className='text-base text-text-secondary text-center'>
          Add your cards to unlock powerful insights
        </Text>
      </View>

      {/* Benefits Section */}
      <View className='mb-12 px-4'>
        <Text className='text-lg font-semibold text-text mb-4'>
          What you can do with your cards:
        </Text>
        <View className='space-y-4'>
          <View className='flex-row items-start'>
            <Text className='text-success text-xl mr-3'>📊</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Track All Spending
              </Text>
              <Text className='text-sm text-text-secondary'>
                See spending patterns across all your cards
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <Text className='text-success text-xl mr-3'>🎯</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Optimize Rewards
              </Text>
              <Text className='text-sm text-text-secondary'>
                Get suggestions on which card to use for maximum rewards
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <Text className='text-success text-xl mr-3'>📈</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Monitor Utilization
              </Text>
              <Text className='text-sm text-text-secondary'>
                Keep track of credit utilization and payment due dates
              </Text>
            </View>
          </View>

          <View className='flex-row items-start'>
            <Text className='text-success text-xl mr-3'>🔍</Text>
            <View className='flex-1'>
              <Text className='text-base font-medium text-text'>
                Analyze Trends
              </Text>
              <Text className='text-sm text-text-secondary'>
                Get insights into your spending habits and trends
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Security Notice */}
      <View className='mb-12 px-4'>
        <View className='bg-surface rounded-md p-4 border border-border'>
          <Text className='text-base font-medium text-text mb-2'>
            🔒 Bank-Level Security
          </Text>
          <Text className='text-sm text-text-secondary leading-5'>
            Your card information is encrypted and stored securely. We never
            store your CVV or full card numbers. Only the last 4 digits are used
            for identification.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className='px-4 space-y-4'>
        <TouchableOpacity
          className={`rounded-md py-4 px-6 items-center ${
            isLoading ? 'bg-disabled' : 'bg-primary'
          }`}
          onPress={handleAddCard}
          disabled={isLoading}
        >
          <Text
            className={`text-base font-semibold ${
              isLoading ? 'text-text-secondary' : 'text-white'
            }`}
          >
            {isLoading ? 'Setting up...' : 'Add My First Card'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className='py-3 px-6 items-center'
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text className='text-base font-medium text-text-secondary'>
            I'll add cards later
          </Text>
        </TouchableOpacity>
      </View>

      {/* Completion Note */}
      <View className='mt-8 px-4'>
        <Text className='text-xs text-text-tertiary text-center leading-4'>
          You can always add, edit, or remove cards from the main menu. Your
          onboarding will be completed when you're ready.
        </Text>
      </View>
    </ScrollView>
  );
};

export default AddFirstCardScreen;
