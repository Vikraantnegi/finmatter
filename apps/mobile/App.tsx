/**
 * FinMatter Mobile App
 * Main App component with navigation and providers
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import FlashMessage from 'react-native-flash-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// NativeWind styles
import './global.css';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Stores
import './src/stores/authStore';
import { useAuthStore } from './src/stores/authStore';

// Components
import BiometricPrompt from './src/components/BiometricPrompt';

const App: React.FC = () => {
  const {
    showBiometricPrompt,
    handleBiometricSuccess,
    handleBiometricFallback,
    handleBiometricCancel,
  } = useAuthStore();

  return (
    <GestureHandlerRootView className='flex-1'>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle='light-content' backgroundColor='#3B82F6' />
          <AppNavigator />
          <FlashMessage position='top' />
        </NavigationContainer>
        <BiometricPrompt
          isVisible={showBiometricPrompt}
          onSuccess={handleBiometricSuccess}
          onFallback={handleBiometricFallback}
          onCancel={handleBiometricCancel}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
