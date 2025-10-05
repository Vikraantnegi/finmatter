/**
 * Main Tab Navigator
 * Handles main app screens with bottom tabs
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import CardsStackNavigator from './CardsStackNavigator';
import TransactionsScreen from '../screens/transactions/TransactionsScreen';
import OptimizerScreen from '../screens/optimizer/OptimizerScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';

// Types
export type RootStackParamList = {
  Home: undefined;
  Cards: undefined;
  Transactions: undefined;
  Optimizer: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootStackParamList>();

const MainNavigator: React.FC = () => {
  const getTabBarIcon = (
    routeName: string,
    focused: boolean,
    color: string,
    size: number,
  ) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    switch (routeName) {
      case 'Home':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'Cards':
        iconName = focused ? 'card' : 'card-outline';
        break;
      case 'Transactions':
        iconName = focused ? 'list' : 'list-outline';
        break;
      case 'Optimizer':
        iconName = focused ? 'analytics' : 'analytics-outline';
        break;
      case 'Profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
      default:
        iconName = 'help-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  return (
    <Tab.Navigator
      initialRouteName='Home'
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#475569',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F8FAFC',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen
        name='Home'
        component={HomeScreen as any}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name='Cards'
        component={CardsStackNavigator as any}
        options={{ tabBarLabel: 'Cards' }}
      />
      <Tab.Screen
        name='Transactions'
        component={TransactionsScreen as any}
        options={{ tabBarLabel: 'Transactions' }}
      />
      <Tab.Screen
        name='Optimizer'
        component={OptimizerScreen as any}
        options={{ tabBarLabel: 'Optimizer' }}
      />
      <Tab.Screen
        name='Profile'
        component={ProfileScreen as any}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
