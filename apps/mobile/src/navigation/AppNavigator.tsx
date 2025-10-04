/**
 * Main App Navigator
 * Handles authentication state and routing
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import LoadingScreen from '../screens/LoadingScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Hooks
import { useAuth } from '../providers/AuthProvider';

// Types
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator as any} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator as any} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
