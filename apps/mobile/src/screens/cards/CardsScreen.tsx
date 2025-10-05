/**
 * Cards Screen
 * Displays user's credit card portfolio
 */

import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

const CardsScreen: React.FC = () => {
  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-1 justify-center items-center p-8'>
        <Text className='text-4xl font-bold text-text mb-4 text-center'>
          Cards
        </Text>
        <Text className='text-2xl font-semibold text-primary mb-6 text-center'>
          Coming Soon
        </Text>
        <Text className='text-base text-text-secondary text-center leading-6'>
          Credit card portfolio and management features will be available soon.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default CardsScreen;
