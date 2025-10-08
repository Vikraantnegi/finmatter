/* eslint-disable react-native/no-inline-styles */
/**
 * Cards Screen
 * Displays user's credit card portfolio
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Plus, CreditCard, Filter, X } from 'lucide-react-native';

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
  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'limit' | 'utilization'>(
    'name',
  );

  // Use SWR hook for data fetching and caching
  const { cards, loading, error, refresh } = useCardsSWR({
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Get card actions from Zustand store
  const { deleteCard } = useCardActions();

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let filtered = [...cards];

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(card =>
        card.benefits?.some(benefit => benefit.category === selectedCategory),
      );
    }

    // Sort cards
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.cardName.localeCompare(b.cardName);
        case 'limit':
          return (b.creditLimit || 0) - (a.creditLimit || 0);
        case 'utilization': {
          const aUtil =
            a.availableCredit && a.creditLimit
              ? ((a.creditLimit - a.availableCredit) / a.creditLimit) * 100
              : 0;
          const bUtil =
            b.availableCredit && b.creditLimit
              ? ((b.creditLimit - b.availableCredit) / b.creditLimit) * 100
              : 0;
          return bUtil - aUtil;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [cards, selectedCategory, sortBy]);

  // Get unique categories from all cards
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    cards.forEach(card => {
      card.benefits?.forEach(benefit => {
        categorySet.add(benefit.category);
      });
    });
    return Array.from(categorySet).sort();
  }, [cards]);

  const handleAddCard = () => {
    haptics.light();
    navigation.navigate('AddCard');
  };

  const handleFilterPress = () => {
    haptics.light();
    setShowFilterModal(true);
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSortBy('name');
    setShowFilterModal(false);
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
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

  const renderCard = ({ item: card }: { item: any }) => (
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

  // Calculate portfolio stats
  const totalCards = cards.length;
  const totalLimit = cards.reduce(
    (sum, card) => sum + (card.creditLimit || 0),
    0,
  );
  const totalUsed = cards.reduce((sum, card) => {
    if (card.creditLimit && card.availableCredit) {
      return sum + (card.creditLimit - card.availableCredit);
    }
    return sum;
  }, 0);
  const totalAvailable = totalLimit - totalUsed;
  const avgUtilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

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
            onPress={handleFilterPress}
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

      {/* Portfolio Stats */}
      {cards.length > 0 && (
        <View className='mx-4 my-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200'>
          <Text className='text-sm text-gray-600 font-medium mb-3'>
            Your Card Portfolio
          </Text>

          <View className='flex-row justify-between mb-4'>
            <View>
              <Text className='text-3xl font-bold text-gray-900'>
                {totalCards}
              </Text>
              <Text className='text-sm text-gray-600'>Total Cards</Text>
            </View>

            {totalLimit > 0 && (
              <View className='items-end'>
                <Text className='text-3xl font-bold text-gray-900'>
                  ₹{(totalLimit / 100000).toFixed(1)}L
                </Text>
                <Text className='text-sm text-gray-600'>Total Limit</Text>
              </View>
            )}
          </View>

          {totalLimit > 0 && (
            <View>
              <View className='flex-row justify-between mb-2'>
                <Text className='text-sm text-gray-600'>
                  Available: ₹{(totalAvailable / 100000).toFixed(1)}L
                </Text>
                <Text className='text-sm text-gray-600'>
                  Utilization: {avgUtilization.toFixed(1)}%
                </Text>
              </View>

              {/* Progress Bar */}
              <View className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                <View
                  style={{
                    width: `${Math.min(avgUtilization, 100)}%`,
                    backgroundColor:
                      avgUtilization > 70
                        ? '#EF4444'
                        : avgUtilization > 40
                        ? '#F59E0B'
                        : '#10B981',
                  }}
                  className='h-full rounded-full'
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Cards List */}
      <FlatList
        data={filteredCards}
        renderItem={renderCard}
        keyExtractor={(item: any) => item.id}
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className='flex-1 bg-black/50 justify-end'>
          <View className='bg-background rounded-t-3xl p-6 max-h-[80%]'>
            <View className='flex-row justify-between items-center mb-6'>
              <Text className='text-xl font-bold text-text'>Filter Cards</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className='p-2'
              >
                <X size={24} color='#6B7280' />
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <View className='mb-6'>
              <Text className='text-lg font-semibold text-text mb-3'>
                Sort By
              </Text>
              <View className='space-y-2'>
                {[
                  { key: 'name', label: 'Card Name' },
                  { key: 'limit', label: 'Credit Limit' },
                  { key: 'utilization', label: 'Utilization' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setSortBy(option.key as any)}
                    className={`p-3 rounded-lg border ${
                      sortBy === option.key
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        sortBy === option.key ? 'text-primary' : 'text-text'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Filter */}
            <View className='mb-6'>
              <Text className='text-lg font-semibold text-text mb-3'>
                Category
              </Text>
              <View className='space-y-2'>
                <TouchableOpacity
                  onPress={() => setSelectedCategory(null)}
                  className={`p-3 rounded-lg border ${
                    selectedCategory === null
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedCategory === null ? 'text-primary' : 'text-text'
                    }`}
                  >
                    All Categories
                  </Text>
                </TouchableOpacity>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    className={`p-3 rounded-lg border ${
                      selectedCategory === category
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    <Text
                      className={`font-medium capitalize ${
                        selectedCategory === category
                          ? 'text-primary'
                          : 'text-text'
                      }`}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View className='flex-row space-x-3'>
              <TouchableOpacity
                onPress={handleClearFilters}
                className='flex-1 bg-surface border border-border py-3 rounded-lg'
              >
                <Text className='text-center font-medium text-text'>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyFilters}
                className='flex-1 bg-primary py-3 rounded-lg'
              >
                <Text className='text-center font-medium text-white'>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CardsScreen;
