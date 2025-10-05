/**
 * Main App Navigator
 * Handles authentication state and routing
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import LoadingScreen from '../screens/LoadingScreen';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';

// Hooks
import { useAuth } from '../providers/AuthProvider';

// Components
import { ToastComponent } from '../components/Toast';

// Types
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, onboardingCompleted } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const getInitialRoute = () => {
    if (!isAuthenticated) {
      return 'Auth';
    } else if (!onboardingCompleted) {
      return 'Onboarding';
    } else {
      return 'Main';
    }
  };

  return (
    <>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={getInitialRoute()}
      >
        {!isAuthenticated ? (
          <Stack.Screen name='Auth' component={AuthNavigator as any} />
        ) : !onboardingCompleted ? (
          <Stack.Screen
            name='Onboarding'
            component={OnboardingNavigator as any}
          />
        ) : (
          <Stack.Screen name='Main' component={MainNavigator as any} />
        )}
      </Stack.Navigator>
      <ToastComponent />
    </>
  );
};

export default AppNavigator;
