/**
 * Onboarding Navigator
 * Handles navigation between onboarding screens
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import NotificationPermissionScreen from '../screens/onboarding/NotificationPermissionScreen';
import SMSPermissionScreen from '../screens/onboarding/SMSPermissionScreen';
import TutorialScreen from '../screens/onboarding/TutorialScreen';
import AddFirstCardScreen from '../screens/onboarding/AddFirstCardScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  NotificationPermission: undefined;
  SMSPermission: undefined;
  Tutorial: undefined;
  AddFirstCard: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
        gestureEnabled: false, // Disable swipe back for onboarding flow
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen as any} />
      <Stack.Screen 
        name="NotificationPermission" 
        component={NotificationPermissionScreen as any} 
      />
      <Stack.Screen 
        name="SMSPermission" 
        component={SMSPermissionScreen as any} 
      />
      <Stack.Screen 
        name="Tutorial" 
        component={TutorialScreen as any} 
      />
      <Stack.Screen 
        name="AddFirstCard" 
        component={AddFirstCardScreen as any} 
      />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
