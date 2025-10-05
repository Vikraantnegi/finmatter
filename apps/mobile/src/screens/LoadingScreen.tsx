/**
 * Loading Screen
 * Shows while app is initializing
 */

import React from 'react';
import { View, Text, ActivityIndicator, SafeAreaView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const LoadingScreen: React.FC = () => {
  return (
    <SafeAreaView className='flex-1'>
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        className='flex-1 justify-center items-center'
      >
        <View className='items-center'>
          <Text className='text-4xl font-bold text-white mb-2'>FinMatter</Text>
          <Text className='text-lg text-white/90 mb-8'>
            Personal Finance Super App
          </Text>
          <ActivityIndicator size='large' color='#FFFFFF' className='mt-6' />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LoadingScreen;
