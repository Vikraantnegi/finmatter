/**
 * Authentication Navigator
 * Handles phone authentication flow: PhoneInput → OTPVerification → BiometricSetup
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import PhoneInputScreen from '../screens/auth/PhoneInputScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import BiometricSetupScreen from '../screens/auth/BiometricSetupScreen';

// Types
export type RootStackParamList = {
  PhoneInput: undefined;
  OTPVerification: {
    phoneNumber: string;
    callingCode: string;
    countryCode: string;
  };
  BiometricSetup: {
    userId: string;
    phoneNumber: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="PhoneInput"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
        gestureEnabled: false, // Disable swipe back for auth flow
      }}
    >
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen as any} />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen as any}
      />
      <Stack.Screen
        name="BiometricSetup"
        component={BiometricSetupScreen as any}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
