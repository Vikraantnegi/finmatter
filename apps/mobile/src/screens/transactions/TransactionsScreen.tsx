/**
 * Transactions Screen
 * Displays user's transaction history
 */

import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

const TransactionsScreen: React.FC = () => {
  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-1 justify-center items-center p-8'>
        <Text className='text-4xl font-bold text-text mb-4 text-center'>
          Transactions
        </Text>
        <Text className='text-2xl font-semibold text-primary mb-6 text-center'>
          Coming Soon
        </Text>
        <Text className='text-base text-text-secondary text-center leading-6'>
          Transaction history and categorization features will be available
          soon.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default TransactionsScreen;
