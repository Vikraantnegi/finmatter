/**
 * Cards Screen
 * Displays user's credit card portfolio
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, CreditCard, Filter } from 'lucide-react-native';

// Types
import { Card } from '@finmatter/types';

// Components
import CreditCardVisual from '../../components/cards/CreditCardVisual';
import EmptyState from '../../components/common/EmptyState';

// Hooks
import { useCardsSWR } from '../../hooks/useCards';
import { useCardActions } from '../../stores/cardStore';

// Utils
import { haptics } from '../../utils/haptics';

interface CardsScreenProps {
  navigation: any;
}

const CardsScreen: React.FC<CardsScreenProps> = ({ navigation }) => {
  // Use SWR hook for data fetching and caching
  const { cards, loading, error, refresh } = useCardsSWR({
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Get card actions from Zustand store
  const { deleteCard } = useCardActions();

  const handleAddCard = () => {
    haptics.light();
    navigation.navigate('AddCard');
  };

  const handleCardPress = (card: Card) => {
    haptics.light();
    navigation.navigate('CardDetail', { cardId: card.id, card });
  };

  const handleDeleteCard = (card: Card) => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete ${card.cardName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              haptics.success();
              const success = await deleteCard(card.id);
              if (!success) {
                Alert.alert('Error', 'Failed to delete card');
              }
            } catch (error) {
              console.error('Delete card error:', error);
              Alert.alert('Error', 'Failed to delete card');
            }
          },
        },
      ],
    );
  };

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const renderCard = ({ item: card }: { item: Card }) => (
    <TouchableOpacity
      onPress={() => handleCardPress(card)}
      className='mb-4 mx-4'
      activeOpacity={0.8}
    >
      <CreditCardVisual card={card} onDelete={() => handleDeleteCard(card)} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={CreditCard}
      title='No Cards Added'
      description='Add your first credit card to start managing your portfolio and getting personalized recommendations.'
      actionText='Add Card'
      onAction={handleAddCard}
    />
  );

  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#3B82F6' />
          <Text className='text-text-secondary mt-4'>Loading cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-1 justify-center items-center p-8'>
          <Text className='text-red-500 text-lg font-semibold mb-2'>Error</Text>
          <Text className='text-text-secondary text-center mb-6'>{error}</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            className='bg-primary px-6 py-3 rounded-lg'
          >
            <Text className='text-white font-semibold'>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      {/* Header */}
      <View className='flex-row items-center justify-between px-4 py-4 border-b border-border'>
        <View>
          <Text className='text-2xl font-bold text-text'>My Cards</Text>
          <Text className='text-text-secondary'>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </Text>
        </View>
        <View className='flex-row space-x-2'>
          <TouchableOpacity
            onPress={() => {
              /* TODO: Implement filter */
            }}
            className='bg-secondary p-3 rounded-lg'
          >
            <Filter size={20} color='#6B7280' />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddCard}
            className='bg-primary p-3 rounded-lg'
          >
            <Plus size={20} color='white' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards List */}
      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor='#3B82F6'
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default CardsScreen;
