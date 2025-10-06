/**
 * Cards Stack Navigator
 * Handles card-related screens with stack navigation
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import CardsScreen from '../screens/cards/CardsScreen';
import AddCardScreen from '../screens/cards/AddCardScreen';
import CardDetailScreen from '../screens/cards/CardDetailScreen';
import AddBenefitScreen from '../screens/cards/AddBenefitScreen';
import EditCardScreen from '../screens/cards/EditCardScreen';
import EditBenefitScreen from '../screens/cards/EditBenefitScreen';

// Types
export type CardsStackParamList = {
  CardsList: undefined;
  AddCard: undefined;
  CardDetail: {
    cardId: string;
    card?: any;
  };
  EditCard: {
    card: any;
  };
  AddBenefit: {
    cardId: string;
    card?: any;
  };
  EditBenefit: {
    cardId: string;
    benefit: any;
    card?: any;
  };
};

const Stack = createStackNavigator<CardsStackParamList>();

const CardsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName='CardsList'
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name='CardsList' component={CardsScreen as any} />
      <Stack.Screen name='AddCard' component={AddCardScreen as any} />
      <Stack.Screen name='CardDetail' component={CardDetailScreen as any} />
      <Stack.Screen name='AddBenefit' component={AddBenefitScreen as any} />
      <Stack.Screen name='EditCard' component={EditCardScreen as any} />
      <Stack.Screen name='EditBenefit' component={EditBenefitScreen as any} />
    </Stack.Navigator>
  );
};

export default CardsStackNavigator;
