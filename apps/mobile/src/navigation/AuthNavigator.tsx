/**
 * Authentication Navigator
 * Handles login, signup, and onboarding screens
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Types
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen as any} />
      <Stack.Screen name="Signup" component={SignupScreen as any} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen as any}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
